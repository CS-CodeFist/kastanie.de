<?php

final class WebsiteRenderer
{
    private $root;
    private $sections = [];
    private $error = false;
    private $usedIds = [];
    private $firstImage = true;
    private $navigationPrefix = '';
    private const LOCATION = [53.631393, 12.569870];
    private const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    private const LINKS = [
        'speisekarte' => 'speisekarte',
        'apartments' => 'apartments',
        'email' => 'mailto:info@bistro-kastanie.de',
        'telefon' => 'tel:+4939933736022',
        'route' => 'https://www.google.com/maps/dir/?api=1&destination=Warener%20Stra%C3%9Fe%203%2C%2017194%20Moltzow'
    ];

    public function __construct($source)
    {
        $this->root = dirname(__DIR__);
        if (!in_array($source, ['webseite', 'apartments'], true)) {
            throw new InvalidArgumentException('Unknown content source');
        }
        $this->navigationPrefix = $source === 'apartments' ? 'apartments/' : '';
        $json = @file_get_contents($this->root . '/' . $source . '/data.json');
        $data = $json === false ? null : json_decode($json, true);
        if (!is_array($data) || !isset($data['webseite']) || !is_array($data['webseite'])) {
            $this->error = true;
            error_log('Website content unavailable: ' . $source);
            return;
        }
        foreach ($data['webseite'] as $section) {
            if (!is_array($section)) continue;
            $index = count($this->sections);
            $type = $section['type'] ?? '';
            $label = $section['menutitel'] ?? '';
            if ($type === 'instagram-feed') $label = $label ?: ($section['titel'] ?? 'instagram');
            if ($type === 'opening-hours') $label = $label ?: 'oeffnungszeiten';
            $id = $index === 0 ? 'start' : $this->slug($label, $index);
            $baseId = $id;
            $suffix = 2;
            while (isset($this->usedIds[$id])) $id = $baseId . '-' . $suffix++;
            $this->usedIds[$id] = true;
            $section['_id'] = $id;
            $this->sections[] = $section;
        }
    }

    public function restaurantSchema()
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Restaurant',
            '@id' => 'https://www.bistro-kastanie.de/#restaurant',
            'name' => 'Kastanie Moltzow',
            'url' => 'https://www.bistro-kastanie.de/',
            'logo' => 'https://www.bistro-kastanie.de/bilder/kastanie-logo.png',
            'image' => 'https://www.bistro-kastanie.de/bilder/icons/social-preview.png',
            'hasMenu' => 'https://www.bistro-kastanie.de/speisekarte',
            'telephone' => substr(self::LINKS['telefon'], 4),
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => 'Warener Strasse 3',
                'postalCode' => '17194',
                'addressLocality' => 'Moltzow',
                'addressCountry' => 'DE'
            ],
            'geo' => ['@type' => 'GeoCoordinates', 'latitude' => self::LOCATION[0], 'longitude' => self::LOCATION[1]]
        ];
        foreach ($this->sections as $section) {
            if (($section['type'] ?? '') !== 'opening-hours') continue;
            $schema += $this->openingHoursSchema($section['openingHours'] ?? null);
            break;
        }
        return $schema;
    }

    private function openingHoursSchema($config)
    {
        if (!is_array($config) || !isset($config['week'], $config['exceptions']) || !is_array($config['week']) || count($config['week']) !== 7 || !is_array($config['exceptions'])) return [];
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $regular = [];
        foreach (array_values($config['week']) as $index => $day) {
            $periods = $this->schemaPeriods($day);
            if ($periods === null) return [];
            foreach ($periods as $period) {
                $regular[] = ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => 'https://schema.org/' . $days[$index], 'opens' => $period['start'], 'closes' => $period['end']];
            }
        }
        $special = [];
        $ranges = [];
        $today = (new DateTimeImmutable('today', new DateTimeZone('Europe/Berlin')))->format('Y-m-d');
        foreach ($config['exceptions'] as $exception) {
            if (!is_array($exception)) return [];
            foreach (['from', 'to'] as $key) {
                $value = $exception[$key] ?? null;
                if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) return [];
                $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value, new DateTimeZone('Europe/Berlin'));
                if (!$date || $date->format('Y-m-d') !== $value) return [];
            }
            if ($exception['from'] > $exception['to']) return [];
            $periods = $this->schemaPeriods($exception);
            if ($periods === null) return [];
            foreach ($ranges as $range) {
                if ($exception['from'] <= $range['to'] && $exception['to'] >= $range['from']) return [];
            }
            $ranges[] = ['from' => $exception['from'], 'to' => $exception['to']];
            if ($exception['to'] < $today) continue;
            foreach ($periods as $period) {
                $special[] = ['@type' => 'OpeningHoursSpecification', 'validFrom' => $exception['from'], 'validThrough' => $exception['to'], 'opens' => $period['start'], 'closes' => $period['end']];
            }
        }
        $result = ['openingHoursSpecification' => $regular];
        if ($special) $result['specialOpeningHoursSpecification'] = $special;
        return $result;
    }

    private function schemaPeriods($day)
    {
        if (!is_array($day) || !isset($day['closed']) || !is_bool($day['closed'])) return null;
        foreach (['privateEvent', 'restDay'] as $flag) {
            if (isset($day[$flag]) && (!is_bool($day[$flag]) || ($day[$flag] && !$day['closed']))) return null;
        }
        if (!empty($day['privateEvent']) && !empty($day['restDay'])) return null;
        if ($day['closed'] || !empty($day['privateEvent']) || !empty($day['restDay'])) return [['start' => '00:00', 'end' => '00:00']];
        if (!isset($day['periods']) || !is_array($day['periods'])) return null;
        $periods = [];
        $previousEnd = '';
        foreach ($day['periods'] as $period) {
            if (!is_array($period) || !isset($period['start'], $period['end']) || !is_string($period['start']) || !is_string($period['end'])) return null;
            if ($period['start'] === '' && $period['end'] === '') continue;
            if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/D', $period['start']) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/D', $period['end'])) return null;
            if ($period['end'] <= $period['start'] || $period['start'] < $previousEnd) return null;
            $previousEnd = $period['end'];
            $periods[] = $period;
        }
        return count($periods) >= 1 && count($periods) <= 2 ? $periods : null;
    }

    private static function escape($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function slug($value, $index)
    {
        $value = strtr((string) $value, ['Ä' => 'A', 'Ö' => 'O', 'Ü' => 'U', 'ä' => 'a', 'ö' => 'o', 'ü' => 'u']);
        if (class_exists('Normalizer')) $value = Normalizer::normalize($value, Normalizer::FORM_D);
        $value = preg_replace('/[\x{0300}-\x{036f}]/u', '', $value);
        $value = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($value)), '-');
        return $value ?: 'sektion-' . ($index + 1);
    }

    private function theme($section, $fallback = '')
    {
        $theme = $section['theme'] ?? $fallback;
        return in_array($theme, ['forest', 'moss', 'clay', 'cream'], true) ? ' theme-' . $theme : '';
    }

    public function navigation()
    {
        foreach ($this->sections as $section) {
            if (empty($section['menutitel']) || ($section['showInMenu'] ?? true) === false) continue;
            echo '<a data-section-link href="' . $this->navigationPrefix . '#' . self::escape($section['_id']) . '">' . self::escape($section['menutitel']) . '</a>';
        }
    }

    public function render()
    {
        if (!$this->sections) {
            echo '<div class="load-error">' . ($this->error ? 'Die Inhalte konnten gerade nicht geladen werden.' : 'Es sind noch keine Inhalte angelegt.') . '</div>';
            return;
        }
        foreach ($this->sections as $index => $section) {
            $heading = $index === 0 ? 'h1' : 'h2';
            if (($section['type'] ?? '') === 'opening-hours') {
                $this->hours($section, $heading);
            } elseif (($section['type'] ?? '') === 'instagram-feed') {
                echo '<section id="' . self::escape($section['_id']) . '" class="instagram-section instagram-feed-section' . $this->theme($section) . '"><div class="section-inner">';
                if (!empty($section['titel']) || $heading === 'h1') echo '<' . $heading . '>' . self::escape(($section['titel'] ?? '') ?: (($section['menutitel'] ?? '') ?: 'Kastanie Moltzow')) . '</' . $heading . '>';
                echo '<div class="instagram-feed" aria-live="polite"><p class="instagram-feed-status">Aktuelle Beiträge finden Sie auf Instagram.</p></div></div></section>';
            } else {
                $this->section($section, $heading);
            }
        }
    }

    private function image($source)
    {
        if (!is_string($source) || $source === '') return null;
        if (strpos($source, 'data:') !== 0) {
            if (!preg_match('~^(?:https?://|(?:\./)?(?:bilder|bilder_webseite|bilder_apartments)/)~i', $source)) return null;
            return ['url' => $source, 'width' => null, 'height' => null];
        }
        if (strlen($source) > 32 * 1024 * 1024 || !preg_match('~^data:image/(?:jpeg|png|gif|webp);base64,(.+)$~s', $source, $match)) return null;
        $bytes = base64_decode($match[1], true);
        if ($bytes === false) return null;
        $info = @getimagesizefromstring($bytes);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
        if (!$info || !isset($extensions[$info['mime']])) return null;
        $directory = $this->root . '/bilder/cache';
        $name = hash('sha256', $bytes) . '.' . $extensions[$info['mime']];
        $path = $directory . '/' . $name;
        if (!is_file($path)) {
            if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
                error_log('Website image cache is not writable');
                return null;
            }
            $temporary = @tempnam($directory, '.image-');
            if ($temporary === false) return null;
            $written = @file_put_contents($temporary, $bytes, LOCK_EX);
            if ($written !== strlen($bytes) || !@chmod($temporary, 0644) || !@rename($temporary, $path)) {
                @unlink($temporary);
                error_log('Website image cache write failed');
                return null;
            }
        }
        return ['url' => 'bilder/cache/' . $name, 'width' => $info[0], 'height' => $info[1]];
    }

    private function section($section, $heading)
    {
        $isMap = in_array($section['mediaType'] ?? '', ['openstreetmap', 'apple-map'], true);
        $image = $isMap ? null : $this->image($section['image'] ?? '');
        $hasImage = $isMap || $image !== null;
        $position = $section['position'] ?? 'zentriert';
        if (!in_array($position, ['links', 'rechts', 'zentriert'], true)) $position = 'zentriert';
        echo '<section id="' . self::escape($section['_id']) . '" class="content-section position-' . $position . $this->theme($section) . ($hasImage ? '' : ' no-image') . '"><div class="section-inner"><div class="section-copy">';
        echo '<' . $heading . '>' . self::escape(($section['titel'] ?? '') ?: (($section['menutitel'] ?? '') ?: 'Kastanie Moltzow')) . '</' . $heading . '>';
        foreach (['untertitel' => 'section-subtitle', 'text' => 'section-text'] as $key => $class) {
            if (empty($section[$key])) continue;
            $text = self::escape($section[$key]);
            if ($key === 'text') {
                $text = preg_replace_callback('/^((?:Telefon|Telefax):[ \t]*)(\+?[0-9][0-9() \t]*[0-9])(?=\r?$)/m', function ($match) {
                    return $match[1] . str_replace([' ', "\t"], '&#160;', $match[2]);
                }, $text);
            }
            echo '<p class="' . $class . '">' . $text . '</p>';
        }
        $href = self::LINKS[$section['buttonLink'] ?? ''] ?? null;
        if (!empty($section['buttonLabel']) && $href) {
            echo '<a class="section-button ' . (($section['buttonTheme'] ?? '') === 'secondary' ? 'secondary' : 'primary') . '" href="' . self::escape($href) . '">' . self::escape($section['buttonLabel']) . '</a>';
        }
        echo '</div>';
        if ($isMap) {
            $this->map();
        } elseif ($image) {
            $dimensions = $image['width'] ? ' width="' . $image['width'] . '" height="' . $image['height'] . '"' : '';
            $loading = $this->firstImage ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"';
            $this->firstImage = false;
            echo '<div class="section-image section-photo"><img src="' . self::escape($image['url']) . '" alt="' . self::escape($section['imageAlt'] ?? '') . '"' . $dimensions . $loading . ' decoding="async"></div>';
        }
        echo '</div></section>';
    }

    private function map()
    {
        echo '<div class="section-image section-map-placeholder" data-location-map data-latitude="' . self::LOCATION[0] . '" data-longitude="' . self::LOCATION[1] . '"><div class="map-preview-area"><div class="map-preview" role="img" aria-label="Kartenansicht der Umgebung von Kastanie Moltzow"></div><div class="map-preview-attribution"><a href="https://openfreemap.org/">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a></div></div><div class="map-consent"><div class="map-consent-actions"><button type="button" class="section-button primary" disabled>Karte laden</button></div><p>Sie stimmen der Übermittlung Ihrer Verbindungsdaten an OpenFreeMap zu. (<a href="datenschutz.php#openstreetmap">Datenschutz</a>)</p><p role="status"></p><noscript>Zum Laden der interaktiven Karte ist JavaScript erforderlich.</noscript></div><div class="section-map-canvas" aria-label="Karte: Kastanie Moltzow, Warener Strasse 3" hidden></div><button type="button" class="map-close" title="Karte schliessen und Freigabe widerrufen" aria-label="Karte schliessen und Freigabe widerrufen" hidden>&times;</button></div>';
    }

    private function hours($section, $heading)
    {
        $config = $section['openingHours'] ?? [];
        $now = new DateTimeImmutable('now', new DateTimeZone('Europe/Berlin'));
        $now = $now->setTime((int) $now->format('G'), (int) $now->format('i'));
        $valid = is_array($config) && isset($config['week'], $config['exceptions']) && is_array($config['week']) && count($config['week']) === 7 && is_array($config['exceptions']);
        echo '<section id="' . self::escape($section['_id']) . '" class="content-section opening-hours-section' . $this->theme($section, 'moss') . '" data-opening-hours="' . self::escape(json_encode($config, JSON_INVALID_UTF8_SUBSTITUTE)) . '"><div class="section-inner"><div class="hours-copy"><p class="eyebrow">' . self::escape(($section['menutitel'] ?? '') ?: 'Öffnungszeiten') . '</p><' . $heading . '>' . self::escape(($section['titel'] ?? '') ?: 'Öffnungszeiten') . '</' . $heading . '>';
        $today = $valid ? $this->day($config, $now) : null;
        $status = 'Öffnungszeiten derzeit nicht verfügbar';
        $detail = '';
        $open = false;
        if ($today) {
            $status = $today['privateEvent'] ? 'Geschlossene Gesellschaft' : ($today['restDay'] ? 'Heute Ruhetag' : ($today['closed'] ? 'Heute geschlossen' : 'Zurzeit geschlossen'));
            $time = $now->format('H:i');
            foreach ($today['periods'] as $period) {
                if ($period['start'] <= $time && $time < $period['end']) {
                    $open = true;
                    $end = $now->setTime((int) substr($period['end'], 0, 2), (int) substr($period['end'], 3, 2));
                    $status = $end->getTimestamp() - $now->getTimestamp() <= 1800 ? 'Schließt bald' : 'Jetzt geöffnet';
                    $detail = 'Bis ' . $period['end'] . ' Uhr geöffnet';
                    break;
                }
                if ($period['start'] > $time) {
                    $detail = 'Heute ab ' . $period['start'] . ' Uhr';
                    break;
                }
            }
            if (!$detail) {
                for ($offset = 1; $offset <= 366; $offset++) {
                    $nextDate = $now->modify('+' . $offset . ' days');
                    $next = $this->day($config, $nextDate);
                    if ($next['periods']) {
                        $detail = 'Wieder geöffnet ' . self::DAYS[(int) $nextDate->format('N') - 1] . ' ab ' . ltrim($next['periods'][0]['start'], '0') . ' Uhr';
                        if (strpos($detail, 'ab :') !== false) $detail = str_replace('ab :', 'ab 0:', $detail);
                        break;
                    }
                }
            }
        }
        echo '<p class="hours-status" data-open="' . ($open ? 'true' : 'false') . '">' . self::escape($status) . '</p><p class="hours-detail">' . self::escape($detail) . '</p><p class="hours-note">' . self::escape($today['note'] ?? '') . '</p></div><dl class="hours-week" aria-label="Öffnungszeiten der nächsten sieben Tage">';
        if ($valid) {
            for ($offset = 0; $offset < 7; $offset++) {
                $date = $now->modify('+' . $offset . ' days');
                $day = $this->day($config, $date);
                echo '<div class="hours-day' . ($offset === 0 ? ' is-today' : '') . '"><dt><span>' . ($offset === 0 ? 'Heute' : self::DAYS[(int) $date->format('N') - 1]) . '</span><time datetime="' . $date->format('Y-m-d') . '">' . $date->format('d.m.') . '</time></dt><dd>';
                if ($day['closed']) {
                    echo $day['privateEvent'] ? 'Geschlossene Gesellschaft' : ($day['restDay'] ? 'Ruhetag' : 'Geschlossen');
                } else {
                    foreach ($day['periods'] as $period) echo '<div>' . self::escape($period['start'] . '–' . $period['end'] . ' Uhr') . '</div>';
                }
                if ($day['note']) echo '<small>' . self::escape($day['note']) . '</small>';
                echo '</dd></div>';
            }
        }
        echo '</dl></div></section>';
    }

    private function day($config, DateTimeImmutable $date)
    {
        $day = $config['week'][(int) $date->format('N') - 1];
        $note = '';
        foreach ($config['exceptions'] as $exception) {
            if (($exception['from'] ?? '') <= $date->format('Y-m-d') && ($exception['to'] ?? '') >= $date->format('Y-m-d')) {
                $day = $exception;
                $note = $exception['note'] ?? '';
                break;
            }
        }
        $closed = !empty($day['closed']);
        return ['closed' => $closed, 'privateEvent' => !empty($day['privateEvent']), 'restDay' => !empty($day['restDay']), 'note' => $note,
            'periods' => $closed ? [] : array_values(array_filter($day['periods'] ?? [], function ($period) {
                return !empty($period['start']) && !empty($period['end']);
            }))];
    }
}