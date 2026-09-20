<?php
$scheme = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
$origin = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? '');
if (!filter_var($origin, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    exit;
}

$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/sitemaps.php'), '/.');
$baseUrl = $origin . $basePath;
$pages = [
    '/' => '/webseite/data.json',
    '/apartments' => '/apartments/data.json',
    '/speisekarte' => '/speisekarte/data.json',
    '/impressum.php' => '/impressum.php',
    '/datenschutz.php' => '/datenschutz.php'
];

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-cache');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($pages as $path => $source) {
    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($baseUrl . $path, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n";
    $modified = is_file(__DIR__ . $source) ? filemtime(__DIR__ . $source) : false;
    if ($modified !== false) {
        echo '    <lastmod>' . gmdate('Y-m-d\TH:i:s\Z', $modified) . "</lastmod>\n";
    }
    echo "  </url>\n";
}
echo "</urlset>\n";