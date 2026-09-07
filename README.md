# Kastanie Moltzow

Webauftritt, digitale Speisekarte und browserbasiertes CMS fuer Kastanie Moltzow. Redaktionelle Inhalte werden als JSON gespeichert und im passwortgeschuetzten Editor bearbeitet. Ein Node- oder Build-Schritt ist nicht erforderlich.

## Oeffentliche Seiten

| Seite | Zweck | Datenquelle |
| --- | --- | --- |
| `index.php` | Webseite mit dynamischen Inhaltssektionen | `webseite/data.json` |
| `apartments.html` | Apartments mit eigener Navigation | `apartments/data.json` |
| `speisekarte.html` | Digitale Speisekarte | `speisekarte/data.json` |
| `impressum.php` | Impressum | Statischer Inhalt |
| `datenschutz.php` | Datenschutzerklaerung | Statischer Inhalt |

Die Webseite und Apartments verwenden den gemeinsamen Renderer `webseite/script.js`. Die Navigation wird aus den Abschnitten erzeugt. Beim Scrollen wird der zugehoerige Punkt aktiviert und bei horizontalem Ueberlauf in den sichtbaren Bereich gefuehrt.

## CMS und Anmeldung

`login.php` meldet am Editor an, `editor.php` stellt die Bearbeitungsoberflaeche bereit und `logout.php` beendet die Sitzung.

Der Editor enthaelt drei Tabs:

- **Webseite:** Inhaltssektionen, Bilder, Textposition, Section-Themes, Call-to-Action-Buttons und Instagram-Feed.
- **Speisekarte:** Menues, Gerichte, Preise, Beilagen, Zusatzstoffe, Vorlagen und saisonale Dekorationen.
- **Apartments:** Separate Inhaltssektionen, Bilder, Textposition, Themes und Archive.

Die Tab-Logik liegt in `editor/editor_tabs.js`. Der Editor laedt die Inhalte eines Tabs erst bei dessen erster Aktivierung.

## Inhaltsdaten

### Webseite und Apartments

`webseite/data.json` und `apartments/data.json` haben dieselbe Grundstruktur:

```json
{
  "webseite": [
    {
      "menutitel": "Kontakt",
      "image": "bilder_webseite/beispiel.webp",
      "titel": "Besuchen Sie uns",
      "untertitel": "Wir freuen uns auf Sie",
      "text": "Freier Beschreibungstext.",
      "position": "links",
      "theme": "forest",
      "buttonLabel": "E-Mail schreiben",
      "buttonLink": "email",
      "buttonTheme": "primary"
    }
  ]
}
```

Unterstuetzte Werte:

| Feld | Werte | Bedeutung |
| --- | --- | --- |
| `position` | `links`, `rechts`, `zentriert` | Position des Textes gegenueber dem Bild |
| `theme` | `forest`, `moss`, `clay`, `cream` | Farbthema einer Sektion |
| `buttonLink` | `speisekarte`, `apartments`, `email` | Ziel eines Buttons |
| `buttonTheme` | `primary`, `secondary` | Darstellung eines Buttons |

Leere Bildwerte werden in der oeffentlichen Ausgabe nicht als Bildflaeche gerendert. Eine Instagram-Sektion hat den Typ `instagram-feed`; sie erscheint nur im Webseitentab und laedt Beitraege ueber den lokalen Endpunkt `instagram_feed.php`.

### Speisekarte

Die Speisekarte verwendet `speisekarte/data.json` mit einem `content`-Array. Ein Menueeintrag besitzt unter anderem `menutitel`, `titel`, `image` und `gerichte`. Gerichte koennen folgende Felder enthalten:

```json
{
  "titel": "Beispielgericht",
  "beschreibung": "Kurze Beschreibung",
  "zusatzstoffetitel": "Inhaltsstoffe",
  "zusatzstoffe": ["Zutat A", "Zutat B"],
  "preisliste": [{ "size": "gross", "preis": "12.50" }],
  "beilagentitel": "Dazu passend",
  "beilagen": [{ "name": "Pommes", "preis": "3.00" }],
  "tag": "Empfehlung"
}
```

Besondere Menueeintraege:

- `logo`: Logo, Link und Begruessungstext.
- `infotext`: Ein freier Informationsbereich am Ende der Speisekarte.

Im Infotext werden die Marker `[instagram]` und `[google]` als externe Links mit Symbolen ausgegeben.

## Bilder

Die Bildbibliotheken sind getrennt:

| Bibliothek | Verzeichnis | Verwendung |
| --- | --- | --- |
| Webseite | `bilder_webseite/` | Webseiten-Sektionen |
| Apartments | `bilder_apartments/` | Apartments-Sektionen |
| Speisekarte | `bilder_menu/` | Menues, Gerichte und Infotext |

Der Upload akzeptiert JPEG, PNG, GIF und WebP. Der Server korrigiert bei JPEG moegliche EXIF-Ausrichtung, skaliert die laengste Kante auf maximal 1600 Pixel, schneidet zentriert quadratisch zu und speichert als WebP mit 80 Prozent Qualitaet. Nicht mehr benoetigte Bilder werden in den Archiv-Unterordner der jeweiligen Bibliothek verschoben.

## Archive und Vorlagen

Vor dem Speichern legt die Anwendung Sicherungen der bestehenden Inhalte an:

| Bereich | Archiv |
| --- | --- |
| Webseite | `webseite/archiv/data_YYYY-MM-DD_HH-MM-SS.json` |
| Apartments | `apartments/archiv/data_YYYY-MM-DD_HH-MM-SS.json` |
| Speisekarte und Vorlagen | `templates/archiv/` |

Speisekarten-Vorlagen liegen als JSON-Dateien direkt unter `templates/`. Die aktuelle Karte ist immer `speisekarte/data.json`.

## Saisonale Dekoration

`config.json` bestimmt die aktive saisonale Dekoration sowie Geschwindigkeit und Menge. Die zugehoerigen Assets und Skripte liegen unter `seasons/`:

```text
seasons/
├── spring/
├── summer/
├── autumn/
├── winter/
└── party/
```

Die saisonalen Einstellungen werden im Speisekarten-Editor unter Optionen gepflegt.

## API

Alle schreibenden und lesenden Editor-Aktionen laufen ueber `data_handler.php`. Relevante Aktionen sind:

| Bereich | Aktionen |
| --- | --- |
| Bilder | `load_images`, `upload_image`, `archive_image` |
| Speisekarte | `save_file`, `list_templates`, `list_archives` |
| Webseite | `save_webseite`, `list_webseiten_archives`, `load_webseiten_archive` |
| Apartments | `save_apartments`, `list_apartments_archives`, `load_apartments_archive` |
| Saison | `load_layout_config`, `save_layout_config`, `get_season_images` |

JSON-Anfragen werden als `application/json` verarbeitet, Bild-Uploads als Formularanfrage. Fehlerantworten werden ebenfalls als JSON geliefert.

## Instagram-Reader

Der eigene Instagram-Reader verwendet die offizielle Meta Graph API. Die Zugangsdaten duerfen nicht im Browser, im Repository oder in JSON-Inhalten stehen. Sie werden als Umgebungsvariablen des Webservers gesetzt:

```text
INSTAGRAM_ACCOUNT_ID=...
INSTAGRAM_ACCESS_TOKEN=...
```

Wenn beim Hosting keine Umgebungsvariablen gesetzt werden koennen, kann stattdessen die lokale Datei `credentials.local.php` angelegt werden. Die Datei ist von Git ausgeschlossen; als Ausgangspunkt dient `credentials.example.php`. Darin stehen auch die Zugangsdaten fuer den Editor:

```php
<?php

return [
  'account_id' => 'DEINE_INSTAGRAM_KONTO_ID',
  'access_token' => 'DEIN_INSTAGRAM_ACCESS_TOKEN',
  'admin_username' => 'DEIN_EDITOR_BENUTZERNAME',
  'admin_password' => 'DEIN_EDITOR_PASSWORT'
];
```

Das Instagram-Konto muss ein Business- oder Creator-Konto sein. Der Zugriffstoken benoetigt die passenden Meta-Berechtigungen fuer das Lesen der Medien. Ohne diese Variablen zeigt der Feed keine Beitraege, die Webseite bleibt aber voll funktionsfaehig.

## Projektstruktur

```text
.
├── index.php                 # Oeffentliche Webseite
├── apartments.html           # Oeffentliche Apartments-Seite
├── speisekarte.html          # Oeffentliche Speisekarte
├── editor.php                # Geschuetztes CMS
├── login.php / logout.php    # Sitzung verwalten
├── data_handler.php          # JSON-API, Uploads und Archive
├── webseite/                 # Webseiten-Daten, Renderer, Styles und Archiv
├── apartments/               # Apartments-Daten und Archiv
├── speisekarte/              # Speisekarten-Daten, Renderer und Styles
├── editor/                   # CMS-Module und Editor-Styles
├── partials/                 # Gemeinsamer Kopf- und Fussbereich der PHP-Seiten
├── bilder/                   # Logo und gemeinsame Assets
├── bilder_webseite/          # Webseiten-Bibliothek
├── bilder_apartments/        # Apartments-Bibliothek
├── bilder_menu/              # Speisekarten-Bibliothek
├── templates/                # Speisekarten-Vorlagen und Archive
├── seasons/                  # Saisonale Effekte
├── config.json               # Saison-Konfiguration
└── .user.ini                 # PHP-Upload-Grenzen
```

## Voraussetzungen und Installation

- PHP 7.4 oder neuer
- PHP-GD mit WebP-Unterstuetzung
- Ein Webserver mit PHP-Unterstuetzung
- Schreibrechte fuer `webseite/`, `apartments/`, `speisekarte/`, `templates/` und die drei Bildbibliotheken inklusive Archiv-Unterordner

Die Upload-Grenzen stehen in `.user.ini`:

```ini
upload_max_filesize = 32M
post_max_size = 40M
```

1. Das Projekt in das Document Root eines PHP-faehigen Webservers legen.
2. Schreibrechte fuer die genannten Daten-, Bild- und Archivordner fuer den Webserver-Benutzer setzen.
3. PHP-GD inklusive WebP aktivieren.
4. Oeffentliche Seiten ueber `index.php`, `apartments.html` und `speisekarte.html` aufrufen.
5. Den Editor ueber `login.php` oeffnen.

Nach Aenderungen an JavaScript oder CSS die Versionsparameter in den jeweiligen `<script>`- und `<link>`-Referenzen erhoehen, damit Browser die neue Datei abrufen.

## Abhaengigkeiten

Die Anwendung bindet externe Bibliotheken per CDN ein:

- Handlebars 4.7.8 fuer Speisekarten-Templates
- SortableJS 1.15.0 fuer Drag-and-drop im Editor
- Google Fonts: Handlee und Noto Sans

## Sicherheit und Wartung

- Zugangsdaten gehoeren nicht in das Repository. Der Login ist aktuell direkt in `login.php` konfiguriert und sollte fuer einen produktiven Betrieb durch sicher gehashte Zugangsdaten ersetzt werden.
- `data_handler.php` ist eine schreibende API und prueft aktuell keine Session. Vor dem produktiven Betrieb muss der Zugriff serverseitig auf angemeldete Nutzer begrenzt werden.
- Archive und Server-Logs sollten nicht direkt ueber das Web erreichbar sein.
- Die Speisekarten-Speicherung setzt die Ausgabedatei auf die Rechte `0644`, damit die oeffentliche Seite sie lesen kann.
- Bei Speicherfehlern zuerst die Schreibrechte der betroffenen Daten- und Archivverzeichnisse sowie das PHP-Fehlerprotokoll pruefen.