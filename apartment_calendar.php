<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function calendarResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$configurationPath = __DIR__ . '/booking_calendar.local.php';
$configuration = is_file($configurationPath) ? require $configurationPath : [];
$url = $configuration['url'] ?? getenv('BOOKING_CALENDAR_URL');
$urlParts = is_string($url) ? parse_url($url) : false;
if (!$urlParts || ($urlParts['scheme'] ?? '') !== 'https'
    || ($urlParts['host'] ?? '') !== 'ical.booking.com'
    || ($urlParts['path'] ?? '') !== '/v1/export'
    || isset($urlParts['user']) || isset($urlParts['pass']) || isset($urlParts['port'])) {
    calendarResponse(['error' => 'Belegungsdaten derzeit nicht verfuegbar.'], 503);
}

$cacheDirectory = __DIR__ . '/apartments/calendar-cache';
$cachePath = $cacheDirectory . '/' . hash('sha256', $url) . '.json';
$cache = is_file($cachePath) ? json_decode((string) @file_get_contents($cachePath), true) : null;
if (is_array($cache) && isset($cache['updatedAt'], $cache['unavailable'])
    && $cache['updatedAt'] > time() - 900) {
    calendarResponse($cache);
}

$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!is_file($autoloadPath) || !function_exists('curl_init')) {
    calendarResponse(['error' => 'Belegungsdaten derzeit nicht verfuegbar.'], 503);
}
require_once $autoloadPath;

try {
    $curl = curl_init($url);
    $body = '';
    curl_setopt_array($curl, [
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_WRITEFUNCTION => static function ($handle, $chunk) use (&$body) {
            if (strlen($body) + strlen($chunk) > 2 * 1024 * 1024) return 0;
            $body .= $chunk;
            return strlen($chunk);
        },
    ]);
    $success = curl_exec($curl);
    $httpStatus = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($success === false || $httpStatus !== 200) throw new RuntimeException('Calendar download failed');

    $calendar = \Sabre\VObject\Reader::read($body);
    if (!($calendar instanceof \Sabre\VObject\Component\VCalendar)) {
        throw new RuntimeException('Invalid calendar');
    }
    $timezone = new DateTimeZone('Europe/Berlin');
    $rangeStart = new DateTimeImmutable('today', $timezone);
    $rangeEnd = $rangeStart->modify('+2 years');
    $unavailable = [];
    foreach ($calendar->select('VEVENT') as $event) {
        if (strtoupper((string) ($event->STATUS ?? '')) === 'CANCELLED') continue;
        if (!isset($event->DTSTART, $event->DTEND) || isset($event->RRULE) || isset($event->RDATE)) {
            throw new RuntimeException('Unsupported calendar event');
        }
        $start = $event->DTSTART->getDateTime($timezone)
            ->setTimezone($timezone)->setTime(0, 0);
        $end = $event->DTEND->getDateTime($timezone)
            ->setTimezone($timezone)->setTime(0, 0);
        if ($end <= $start) throw new RuntimeException('Invalid calendar interval');
        $start = max($start, $rangeStart);
        $end = min($end, $rangeEnd);
        for ($date = $start; $date < $end; $date = $date->modify('+1 day')) {
            $unavailable[$date->format('Y-m-d')] = true;
        }
    }
    $dates = array_keys($unavailable);
    sort($dates);
    $result = ['unavailable' => $dates, 'updatedAt' => time(),
        'rangeStart' => $rangeStart->format('Y-m-d'), 'rangeEnd' => $rangeEnd->format('Y-m-d')];
    if (is_dir($cacheDirectory) || @mkdir($cacheDirectory, 0700, true)) {
        $temporary = @tempnam($cacheDirectory, '.calendar-');
        if ($temporary !== false) {
            if (@file_put_contents($temporary, json_encode($result), LOCK_EX) !== false) {
                @chmod($temporary, 0600);
                @rename($temporary, $cachePath);
            }
            if (is_file($temporary)) @unlink($temporary);
        }
    }
    calendarResponse($result);
} catch (Throwable $error) {
    error_log('Booking calendar could not be refreshed');
    calendarResponse(['error' => 'Belegungsdaten derzeit nicht verfuegbar.'], 503);
}