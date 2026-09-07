<?php
ini_set('memory_limit', '128M');
header('Content-Type: application/json');

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

function respondWithError($message, $code = 500, $details = null) {
    http_response_code($code);
    echo json_encode([
        'error' => $message,
        'details' => $details
    ]);
    exit;
}

$input = ($_SERVER['CONTENT_TYPE'] ?? '') === 'application/json'
  ? json_decode(file_get_contents("php://input"), true)
  : $_POST;

$action = $input['action'] ?? $_POST['action'] ?? null;

if ($action === null && ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        respondWithError('Upload konnte nicht verarbeitet werden. Das Bild überschreitet wahrscheinlich die PHP-Uploadgrenze.', 413);
}

switch ($action) {
    case 'list_templates':
        $templateDir = __DIR__ . '/templates';
        $files = glob($templateDir . '/*.json');

        $templateNames = array_map(function($file) {
            return pathinfo($file, PATHINFO_FILENAME);
        }, $files);

        echo json_encode($templateNames);
        break;

    case 'load_images':
        $library = $input['library'] ?? 'menu';
        if (!in_array($library, ['menu', 'webseite', 'apartments'], true)) $library = 'menu';
        $imageDir = __DIR__ . [
            'menu' => '/bilder_menu/',
            'webseite' => '/bilder_webseite/',
            'apartments' => '/bilder_apartments/'
        ][$library];
        $images = [];

        foreach (glob($imageDir . '*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE) as $file) {
            $images[] = [
                'name' => basename($file),
                'mtime' => filemtime($file),
                'src' => 'data:' . mime_content_type($file) . ';base64,' . base64_encode(file_get_contents($file))
            ];
        }

        usort($images, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
        echo json_encode($images);
        break;

    case 'upload_image':
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            respondWithError('Upload-Fehler', 400);
        }

        $library = $_POST['library'] ?? 'menu';
        if (!in_array($library, ['menu', 'webseite', 'apartments'], true)) $library = 'menu';
        $uploadDir = __DIR__ . [
            'menu' => '/bilder_menu/',
            'webseite' => '/bilder_webseite/',
            'apartments' => '/bilder_apartments/'
        ][$library];
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        if (!is_writable($uploadDir)) respondWithError('Upload-Verzeichnis nicht beschreibbar.');

        $file = $_FILES['image'];
        $tmpPath = $file['tmp_name'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $mime = mime_content_type($tmpPath) ?: '';
		$supportedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		if (!in_array($mime, $supportedMimes, true)) {
			respondWithError('Nicht unterstütztes Format: ' . ($mime ?: 'unbekannt'), 400);
		}

        $basename = pathinfo($file['name'], PATHINFO_FILENAME);
        $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $basename);
        $filename = $safeName . '_' . time() . '.webp';
        $target = $uploadDir . $filename;

        $imgInfo = @getimagesize($tmpPath);
        if (!$imgInfo) {
            respondWithError('getimagesize() fehlgeschlagen');
        }

        $mime = $imgInfo['mime'];

        switch ($mime) {
            case 'image/jpeg':
                $srcImage = @imagecreatefromjpeg($tmpPath);
                break;
            case 'image/png':
                $srcImage = @imagecreatefrompng($tmpPath);
                // PNG Transparenz aktivieren
                imagealphablending($srcImage, false);
                imagesavealpha($srcImage, true);
                break;
            case 'image/gif':
                $srcImage = @imagecreatefromgif($tmpPath);
                break;
			case 'image/webp':
				$srcImage = @imagecreatefromwebp($tmpPath);
				break;
            default:
                respondWithError('Nicht unterstütztes Format: ' . $mime);
        }

        if (!$srcImage) {
            respondWithError('Bild konnte nicht geladen werden.');
        }

        // EXIF-Ausrichtung korrigieren
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data($tmpPath);
            if (!empty($exif['Orientation'])) {
                switch ($exif['Orientation']) {
                    case 3:
                        $srcImage = imagerotate($srcImage, 180, 0);
                        break;
                    case 6:
                        $srcImage = imagerotate($srcImage, -90, 0);
                        break;
                    case 8:
                        $srcImage = imagerotate($srcImage, 90, 0);
                        break;
                }
            }
        }

        // Neue Dimensionen nach Rotation holen
        $width = imagesx($srcImage);
        $height = imagesy($srcImage);

        // Resize auf max 1600px
        $maxSize = 1600;
        $ratio = $width / $height;
        if ($width > $maxSize || $height > $maxSize) {
            if ($ratio > 1) {
                $newWidth = intval($maxSize);
                $newHeight = intval($maxSize / $ratio);
            } else {
                $newWidth = intval($maxSize * $ratio);
                $newHeight = intval($maxSize);
            }
        } else {
            $newWidth = $width;
            $newHeight = $height;
        }

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        
        // Transparenz für das resized Bild aktivieren
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        
        // Transparenten Hintergrund setzen
        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefill($resized, 0, 0, $transparent);
        
        imagecopyresampled($resized, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        $side = intval(min($newWidth, $newHeight));
        $srcX = intval(($newWidth - $side) / 2);
        $srcY = intval(($newHeight - $side) / 2);
        $square = imagecreatetruecolor($side, $side);
        
        // Transparenz für das quadratische Bild aktivieren
        imagealphablending($square, false);
        imagesavealpha($square, true);
        
        // Transparenten Hintergrund setzen
        $transparent = imagecolorallocatealpha($square, 0, 0, 0, 127);
        imagefill($square, 0, 0, $transparent);
        
        imagecopyresampled($square, $resized, 0, 0, $srcX, $srcY, $side, $side, $side, $side);

        if (!imagewebp($square, $target, 80)) {
            respondWithError('Bild konnte nicht gespeichert werden.');
        }

        imagedestroy($srcImage);
        imagedestroy($resized);
        imagedestroy($square);

        echo json_encode(['success' => true, 'filename' => $filename]);
        break;
    
    
    case 'archive_image':
        $filename = basename($_POST['filename'] ?? '');
        $library = $_POST['library'] ?? 'menu';
        if (!in_array($library, ['menu', 'webseite', 'apartments'], true)) $library = 'menu';
        $imageDir = __DIR__ . [
            'menu' => '/bilder_menu/',
            'webseite' => '/bilder_webseite/',
            'apartments' => '/bilder_apartments/'
        ][$library];
        $source = $imageDir . $filename;
        $target = $imageDir . 'archiv/' . $filename;
        if (!file_exists($source)) respondWithError('Datei nicht gefunden', 404);
        if (!is_dir(dirname($target))) mkdir(dirname($target), 0755, true);
        rename($source, $target);
        echo json_encode(['success' => true]);
        break;

    case 'save_file':
        $filename = basename($input['filename'] ?? '');
        $content = $input['content'] ?? null;

        if (!$filename || !$content) {
            respondWithError('Ungültiger Dateiname oder Inhalt', 400);
        }

        $archiveDir = __DIR__ . '/templates/archiv/';
        if (!is_dir($archiveDir)) mkdir($archiveDir, 0755, true);

        if ($filename === 'data.json') {
            $targetFile = __DIR__ . '/speisekarte/data.json';
            $archivName = 'data_' . date('Y-m-d_H-i-s') . '.json';
        } else {
            $templateDir = __DIR__ . '/templates/';
            if (!is_dir($templateDir)) mkdir($templateDir, 0755, true);

            $targetFile = $templateDir . $filename;
            $archivName = pathinfo($filename, PATHINFO_FILENAME) . '_' . date('Y-m-d_H-i-s') . '.json';
        }

        $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            respondWithError('Daten konnten nicht als JSON gespeichert werden.', 400);
        }

        $tempFile = tempnam(dirname($targetFile), '.save-');
        if ($tempFile === false || file_put_contents($tempFile, $json, LOCK_EX) === false) {
            if ($tempFile !== false) unlink($tempFile);
            respondWithError('Neue Datei konnte nicht geschrieben werden.');
        }

        $archiveFile = $archiveDir . $archivName;
        if (file_exists($targetFile) && !rename($targetFile, $archiveFile)) {
            unlink($tempFile);
            respondWithError('Bestehende Datei konnte nicht archiviert werden.');
        }
        if (file_exists($archiveFile)) chmod($archiveFile, 0644);

        if (!rename($tempFile, $targetFile)) {
            if (file_exists($archiveFile)) rename($archiveFile, $targetFile);
            unlink($tempFile);
            respondWithError('Neue Datei konnte nicht übernommen werden.');
        }
        if (!chmod($targetFile, 0644)) {
            respondWithError('Speisekarte wurde gespeichert, konnte aber nicht lesbar gesetzt werden. Bitte Dateirechte prüfen.');
        }

        echo json_encode(['success' => true]);
        break;

    case 'list_templates':
        $templateDir = __DIR__ . '/templates/';
        $templates = [];

        if (is_dir($templateDir)) {
            foreach (glob($templateDir . '*.json') as $file) {
                $templates[] = pathinfo(basename($file), PATHINFO_FILENAME);
            }
        }

        echo json_encode($templates);
        break;

    case 'list_archives':
        $template = basename($_POST['template'] ?? '');
        $includeAll = ($_POST['all'] ?? '0') === '1';
    
        if (!$template) {
            respondWithError('Kein Template angegeben');
        }
    
        $archiveDir = __DIR__ . "/templates/archiv/";
        if (!is_dir($archiveDir)) {
            echo json_encode(['archives' => [], 'hasMore' => false]);
            break;
        }
    
        $pattern = $archiveDir . $template . '_*.json';
        $files = glob($pattern);
    
        // Sortieren nach Datum im Dateinamen (Format: template_YYYY-MM-DD_HH-MM-SS.json)
        usort($files, function ($a, $b) {
            $aBase = basename($a);
            $bBase = basename($b);
            $pattern = '/_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/';
    
            preg_match($pattern, $aBase, $matchA);
            preg_match($pattern, $bBase, $matchB);
    
            $timeA = isset($matchA[1], $matchA[2]) ? strtotime($matchA[1] . ' ' . str_replace('-', ':', $matchA[2])) : 0;
            $timeB = isset($matchB[1], $matchB[2]) ? strtotime($matchB[1] . ' ' . str_replace('-', ':', $matchB[2])) : 0;
    
            return $timeB - $timeA; // Absteigend sortieren
        });
    
        $names = array_map('basename', $files);

        $archiveLimit = 20;
        $hasMore = !$includeAll && count($names) > $archiveLimit;
        if (!$includeAll) {
            $names = array_slice($names, 0, $archiveLimit);
        }

        echo json_encode(['archives' => $names, 'hasMore' => $hasMore]);
        break;

    case 'list_webseiten_archives':
        $archiveDir = __DIR__ . "/webseite/archiv/";
        if (!is_dir($archiveDir)) {
            echo json_encode([]);
            break;
        }
    
        $pattern = $archiveDir . 'data_*.json';
        $files = glob($pattern);
    
        // Sortieren nach Datum im Dateinamen (Format: data_YYYY-MM-DD_HH-MM-SS.json)
        usort($files, function ($a, $b) {
            $aBase = basename($a);
            $bBase = basename($b);
            $pattern = '/data_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/';
    
            preg_match($pattern, $aBase, $matchA);
            preg_match($pattern, $bBase, $matchB);
    
            $timeA = isset($matchA[1], $matchA[2]) ? strtotime($matchA[1] . ' ' . str_replace('-', ':', $matchA[2])) : 0;
            $timeB = isset($matchB[1], $matchB[2]) ? strtotime($matchB[1] . ' ' . str_replace('-', ':', $matchB[2])) : 0;
    
            return $timeB - $timeA; // Absteigend sortieren
        });
    
        $names = array_map('basename', $files);
    
        echo json_encode($names);
        break;

    case 'load_webseiten_archive':
        $archiveFile = basename($_POST['archive'] ?? '');
        
        if (!$archiveFile) {
            respondWithError('Keine Archiv-Datei angegeben');
        }
        
        $archiveDir = __DIR__ . "/webseite/archiv/";
        $filePath = $archiveDir . $archiveFile;
        
        if (!file_exists($filePath)) {
            respondWithError('Archiv-Datei nicht gefunden');
        }
        
        $content = file_get_contents($filePath);
        $data = json_decode($content, true);
        
        if (!$data) {
            respondWithError('Ungültige Archiv-Datei');
        }
        
        echo json_encode($data);
        break;

    case 'list_apartments_archives':
        $archiveDir = __DIR__ . '/apartments/archiv/';
        $files = is_dir($archiveDir) ? glob($archiveDir . 'data_*.json') : [];
        usort($files, function($a, $b) {
            return filemtime($b) <=> filemtime($a);
        });
        echo json_encode(array_map('basename', $files));
        break;

    case 'load_apartments_archive':
        $archiveFile = basename($input['archive'] ?? '');
        $filePath = __DIR__ . '/apartments/archiv/' . $archiveFile;
        if (!$archiveFile || !file_exists($filePath)) {
            respondWithError('Archiv-Datei nicht gefunden', 404);
        }
        $data = json_decode(file_get_contents($filePath), true);
        if (!is_array($data)) {
            respondWithError('Ungültige Archiv-Datei');
        }
        echo json_encode($data);
        break;

        case 'load_layout_config':
            $configFile = __DIR__ . '/config.json';
            if (!file_exists($configFile)) {
                respondWithError('config.json nicht gefunden', 404);
            }
            $json = file_get_contents($configFile);
            $data = json_decode($json, true);
    
            if (!is_array($data)) {
                respondWithError('Ungültige JSON-Struktur in config.json');
            }
    
            echo json_encode($data);
            break;


            $json = $_POST['data'] ?? '';

            // Prüfen ob gültiges JSON
            $decoded = json_decode($json, true);
            if (!is_array($decoded)) {
                echo json_encode(['success' => false, 'error' => 'Ungültiges JSON']);
                exit;
            }
        
        case 'save_layout_config':
            $json = $_POST['data'] ?? '';

            // Prüfen ob gültiges JSON
            $decoded = json_decode($json, true);
            if (!is_array($decoded)) {
                echo json_encode(['success' => false, 'error' => 'Ungültiges JSON']);
                exit;
            }

            // Neue Datei speichern
            if (file_put_contents('config.json', json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Konnte Datei nicht schreiben']);
            }
        break;


    case 'get_season_images':
        $seasonId = isset($_POST['data']) ? basename($_POST['data']) : null;

        if (!$seasonId) {
            http_response_code(400);
            echo json_encode(["error" => "Keine Saison-ID übergeben."]);
            exit;
        }
        
        $folder = __DIR__ . "/seasons/$seasonId";
    
        // Verzeichnis prüfen
        if (!is_dir($folder)) {
            http_response_code(404);
            echo json_encode(["error" => "Ordner '$seasonId' nicht gefunden"]);
            exit;
        }
    
        $files = glob($folder . "/*.{png,jpg,jpeg,gif,webp}", GLOB_BRACE);
        if (!$files) {
            echo json_encode([]); // keine Dateien gefunden
            exit;
        }
    
        $images = [];
    
        foreach ($files as $file) {
            try {
                $base64 = base64_encode(file_get_contents($file));
                $mime = mime_content_type($file);
                $images[] = "data:$mime;base64,$base64";
            } catch (Exception $e) {
                // Optionales Logging
                error_log("Fehler beim Lesen von $file: " . $e->getMessage());
            }
        }
    
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode($images, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        break;

    case 'save_webseite':
        $data = $input['data'] ?? null;
        
        if (!$data) {
            respondWithError('Keine Webseiten-Daten übertragen');
        }
        
        $webseitenDir = __DIR__ . '/webseite/';
        if (!is_dir($webseitenDir)) {
            mkdir($webseitenDir, 0755, true);
        }
        
        $targetFile = $webseitenDir . 'data.json';
        
        // Backup der alten Datei erstellen
        if (file_exists($targetFile)) {
            $archiveDir = __DIR__ . '/webseite/archiv/';
            if (!is_dir($archiveDir)) {
                mkdir($archiveDir, 0755, true);
            }
            
            $backupName = 'data_' . date('Y-m-d_H-i-s') . '.json';
            copy($targetFile, $archiveDir . $backupName);
        }
        
        $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if (file_put_contents($targetFile, $jsonData) !== false) {
            echo json_encode(['success' => true, 'message' => 'Webseiten-Daten erfolgreich gespeichert']);
        } else {
            respondWithError('Fehler beim Speichern der Webseiten-Daten');
        }
        break;

    case 'save_apartments':
        $data = $input['data'] ?? null;
        if (!is_array($data)) {
            respondWithError('Keine Apartments-Daten übertragen', 400);
        }

        $apartmentsDir = __DIR__ . '/apartments/';
        $archiveDir = $apartmentsDir . 'archiv/';
        if (!is_dir($apartmentsDir) && !mkdir($apartmentsDir, 0755, true) && !is_dir($apartmentsDir)) {
            respondWithError('Apartments-Verzeichnis konnte nicht erstellt werden. Bitte Schreibrechte prüfen.');
        }
        if (!is_dir($archiveDir) && !mkdir($archiveDir, 0755, true) && !is_dir($archiveDir)) {
            respondWithError('Apartments-Archiv konnte nicht erstellt werden. Bitte Schreibrechte prüfen.');
        }
        if (!is_writable($apartmentsDir) || !is_writable($archiveDir)) {
            respondWithError('Apartments-Verzeichnis ist nicht beschreibbar. Bitte Schreibrechte prüfen.');
        }

        $targetFile = $apartmentsDir . 'data.json';
        if (file_exists($targetFile) && !copy($targetFile, $archiveDir . 'data_' . date('Y-m-d_H-i-s') . '.json')) {
            respondWithError('Apartments-Daten konnten nicht archiviert werden. Bitte Schreibrechte prüfen.');
        }

        $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($jsonData === false || file_put_contents($targetFile, $jsonData, LOCK_EX) === false) {
            respondWithError('Fehler beim Speichern der Apartments-Daten');
        }
        echo json_encode(['success' => true, 'message' => 'Apartments-Daten erfolgreich gespeichert']);
        break;

    default:
        respondWithError('Ungültige Aktion', 400, $action);
}