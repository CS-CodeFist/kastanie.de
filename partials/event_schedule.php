<?php

final class EventSchedule
{
    public static function validSlot($section)
    {
        if (!is_array($section)) return false;
        $date = $section['date'] ?? null;
        $start = $section['start'] ?? null;
        $end = $section['end'] ?? null;
        if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) return false;
        if (!checkdate((int) substr($date, 5, 2), (int) substr($date, 8, 2), (int) substr($date, 0, 4))) return false;
        foreach ([$start, $end] as $time) {
            if (!is_string($time) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D', $time)) return false;
        }
        return $start < $end;
    }

    public static function compare($left, $right)
    {
        $leftKey = self::validSlot($left) ? $left['date'] . 'T' . $left['start'] : '9999-99-99';
        $rightKey = self::validSlot($right) ? $right['date'] . 'T' . $right['start'] : '9999-99-99';
        return strcmp($leftKey, $rightKey);
    }

    public static function validate($sections)
    {
        if (!is_array($sections) || array_values($sections) !== $sections) return 'Ungueltige Veranstaltungssektionen.';
        $ordered = [];
        foreach ($sections as $index => $section) {
            if (!self::validSlot($section)) {
                return 'Sektion ' . ($index + 1) . ': Bitte ein gueltiges Datum und Von-/Bis-Zeiten angeben. Bis muss nach Von liegen (am selben Tag).';
            }
            $ordered[] = ['section' => $section, 'number' => $index + 1];
        }
        usort($ordered, function ($left, $right) {
            return self::compare($left['section'], $right['section']);
        });
        for ($index = 1; $index < count($ordered); $index++) {
            $previous = $ordered[$index - 1];
            $current = $ordered[$index];
            if ($previous['section']['date'] === $current['section']['date'] && $current['section']['start'] < $previous['section']['end']) {
                return 'Sektionen ' . $previous['number'] . ' und ' . $current['number'] . ': Datum und Uhrzeit ueberschneiden sich.';
            }
        }
        return null;
    }

    public static function openingHours($config, $sections)
    {
        if (!is_array($config) || !isset($config['exceptions']) || !is_array($config['exceptions']) || !is_array($sections)) return $config;
        $events = array_values(array_filter($sections, function ($section) {
            return self::validSlot($section) && ($section['active'] ?? true) !== false;
        }));
        usort($events, [self::class, 'compare']);
        $days = [];
        foreach ($events as $event) {
            $date = $event['date'];
            if (!isset($days[$date])) {
                $days[$date] = ['from' => $date, 'to' => $date, 'closed' => false, 'privateEvent' => false,
                    'restDay' => false, 'periods' => [], 'note' => ''];
            }
            $day = &$days[$date];
            $last = count($day['periods']) - 1;
            if ($last >= 0 && $event['start'] <= $day['periods'][$last]['end']) {
                $day['periods'][$last]['end'] = max($day['periods'][$last]['end'], $event['end']);
            } else {
                $day['periods'][] = ['start' => $event['start'], 'end' => $event['end']];
            }
            $title = trim((string) (($event['titel'] ?? '') ?: ($event['menutitel'] ?? '')));
            $day['note'] .= ($day['note'] === '' ? '' : ' / ') . ($title ?: 'Veranstaltung');
            unset($day);
        }
        foreach ($days as $date => $day) {
            $eventDate = new DateTimeImmutable($date, new DateTimeZone('Europe/Berlin'));
            $scheduledDay = $config['week'][(int) $eventDate->format('N') - 1] ?? [];
            $hasException = false;
            $exceptions = [];
            foreach ($config['exceptions'] as $exception) {
                if (!is_array($exception) || !isset($exception['from'], $exception['to']) || $exception['from'] > $date || $exception['to'] < $date) {
                    $exceptions[] = $exception;
                    continue;
                }
                if (!$hasException) {
                    $scheduledDay = $exception;
                    $hasException = true;
                }
                if ($exception['from'] < $date) {
                    $before = $exception;
                    $before['to'] = $eventDate->modify('-1 day')->format('Y-m-d');
                    $exceptions[] = $before;
                }
                if ($exception['to'] > $date) {
                    $after = $exception;
                    $after['from'] = $eventDate->modify('+1 day')->format('Y-m-d');
                    $exceptions[] = $after;
                }
            }
            if (($scheduledDay['closed'] ?? true) === false) {
                $eventPeriods = $day['periods'];
                $keptPeriod = false;
                foreach ($scheduledDay['periods'] ?? [] as $period) {
                    if (!is_array($period) || !self::validSlot(['date' => $date] + $period)) continue;
                    foreach ($eventPeriods as $eventPeriod) {
                        if ($period['start'] < $eventPeriod['end'] && $eventPeriod['start'] < $period['end']) continue 2;
                    }
                    $day['periods'][] = $period;
                    $keptPeriod = true;
                }
                if ($keptPeriod && !empty($scheduledDay['note'])) {
                    $day['note'] = $scheduledDay['note'] . ' / ' . $day['note'];
                }
                usort($day['periods'], function ($left, $right) {
                    return strcmp($left['start'], $right['start']);
                });
            }
            $exceptions[] = $day;
            $config['exceptions'] = $exceptions;
        }
        return $config;
    }
}