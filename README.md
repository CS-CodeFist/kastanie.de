# Kastanie Moltzow

Webauftritt, digitale Speisekarte und browserbasiertes CMS fuer Kastanie Moltzow. Redaktionelle Inhalte werden als JSON gespeichert und im passwortgeschuetzten Editor bearbeitet. Ein Node- oder Build-Schritt ist nicht erforderlich.

## Oeffentliche Seiten

| Seite | Zweck | Datenquelle |
| --- | --- | --- |
| `index.php` | Webseite mit dynamischen Inhaltssektionen | `webseite/data.json` |
| `apartments.php` | Apartments mit eigener Navigation | `apartments/data.json` |
| `speisekarte.html` | Digitale Speisekarte | `speisekarte/data.json` |
| `impressum.php` | Impressum | Statischer Inhalt |
| `datenschutz.php` | Datenschutzerklaerung | Statischer Inhalt |

Die Webseite und Apartments verwenden den gemeinsamen Renderer `webseite/script.js`. Die Navigation wird aus den Abschnitten erzeugt. Beim Scrollen wird der zugehoerige Punkt aktiviert und bei horizontalem Ueberlauf in den sichtbaren Bereich gefuehrt.

Startseite, Apartments und rechtliche Seiten binden `partials/header.php` und `partials/footer.php` ein. Weitere PHP-Seiten setzen vor dem Header-Include ihren `$pageTitle`, `$pageDescription` und `$pagePath`. Fuer JSON-Inhalte koennen sie wie `apartments.php` zusaetzlich `$contentSource`, `$hasSectionNavigation` und `$navigationLabel` setzen und den gemeinsamen Renderer laden. `$baseHref` ist optional und wird fuer die Apartments-Adresse mit abschliessendem Slash auf `../` gesetzt.

Die oeffentliche Apartments-Adresse bleibt `/apartments/`. `.htaccess` leitet auch bisherige HTML-Links und direkte Aufrufe von `apartments.php` dorthin weiter. Bei der Umstellung `apartments.php` und den gemeinsamen Header zuerst hochladen, danach `.htaccess` aktualisieren und die alte `apartments.html` auf dem Server entfernen.

## Metadaten und Icons

Die oeffentlichen Seiten enthalten individuelle Titel, Beschreibungen und kanonische URLs fuer `https://www.bistro-kastanie.de`. Open-Graph- und Twitter-Card-Metadaten verweisen auf das gemeinsame PNG-Vorschaubild mit 1200 x 630 Pixeln. Die Startseite enthaelt zusaetzlich strukturierte Restaurantdaten (JSON-LD); bei Adressaenderungen muss auch `partials/header.php` angepasst werden.

Die Originale `bilder/kastanie-logo-pur.png` und `bilder/kastanie-logo.png` bleiben unveraendert. Daraus entstehen:

- `favicon.ico` mit 16, 32 und 48 Pixeln sowie PNG-Favicons unter `bilder/icons/`.
- Apple-Touch-Icon mit 180 Pixeln und App-Icons mit 192 und 512 Pixeln.
- Ein separates maskierbares 512-Pixel-Icon mit Sicherheitsabstand fuer Android.
- `bilder/icons/social-preview.png` fuer Linkvorschauen.
- `bilder/icons/instagram-profile.png` als kreissicheres Profilbild (600 x 600), das manuell bei Instagram hochgeladen wird. Website-Metadaten aendern das Instagram-Profilbild nicht.

`site.webmanifest` beschreibt Name, Startseite, Farben und App-Icons. Es stellt keine Offline-Funktion bereit und garantiert keine Installationsaufforderung; das Verhalten haengt vom Browser ab.

Zum erneuten Erzeugen der Bilddateien wird Python 3 mit Pillow benoetigt (`python3 -m pip install Pillow`):

```sh
python3 tools/generate_icons.py
```

Das ist eine Bildkonvertierung, kein Website-Build. Fuer das Deployment werden `favicon.ico`, `site.webmanifest`, `bilder/kastanie-logo.svg`, der komplette Ordner `bilder/icons/` und die geaenderten PHP-/HTML-Seiten einschliesslich `partials/header.php` benoetigt. Das Python-Werkzeug muss nicht auf den Webserver. Das Original `bilder/kastanie-logo.svg` ist auf allen oeffentlichen Seiten als skalierbares SVG-Favicon eingebunden; PNG und ICO bleiben als Fallback erhalten. Apple-Touch-Icons und Social-Vorschaubilder verwenden weiterhin PNG fuer breite Kompatibilitaet.

## CMS und Anmeldung

`login.php` meldet am Editor an, `editor.php` stellt die Bearbeitungsoberflaeche bereit und `logout.php` beendet die Sitzung. Die Sitzung wird in PHP verwaltet.

Die Zugangsdaten liegen ausschliesslich in einer lokalen, von Git ignorierten PHP-Datei. Die bevorzugte Datei ist `credentials.local.php`; aus Kompatibilitaetsgruenden werden auch `site_credentials.local.php` und `instagram_credentials.local.php` gelesen. Mindestens die folgenden Werte muessen in `credentials.local.php` gesetzt sein:

```php
<?php

return [
  'admin_username' => 'EDITOR_BENUTZERNAME',
  'admin_password' => 'SICHERES_EDITOR_PASSWORT',
  'account_id' => 'INSTAGRAM_KONTO_ID',
  'access_token' => 'INSTAGRAM_ACCESS_TOKEN'
];
```

Ohne `admin_username` und `admin_password` ist keine Editor-Anmeldung moeglich. Die Datei darf nicht ueber das Deployment, ein Backup oder ein Repository weitergegeben werden.

Der Editor enthaelt drei Tabs:

- **Webseite:** Inhaltssektionen, Bilder, Textposition, Section-Themes, Call-to-Action-Buttons, Instagram-Feed und Oeffnungszeiten.
- **Speisekarte:** Menues, Gerichte, Preise, Beilagen, Zusatzstoffe, Vorlagen und saisonale Dekorationen.
- **Apartments:** Separate Inhaltssektionen, Bilder, Textposition, Themes und Archive.

Die Tab-Logik liegt in `editor/editor_tabs.js`. Der Editor laedt die Inhalte eines Tabs erst bei dessen erster Aktivierung.

### Oeffnungszeiten

Im Webseiten-Tab unter **Sektion hinzufuegen > Oeffnungszeiten** wird eine Sektion mit Wochenzeiten und datierten Ausnahmen angelegt. Neue Sektionen starten mit sieben geschlossenen Tagen; es werden keine Beispielzeiten gespeichert. Pro Tag sind bis zu zwei aufsteigende, nicht ueberlappende Zeitfenster am selben Tag moeglich. Zeiten ueber Mitternacht werden nicht unterstuetzt.

Ausnahmen gelten vom Startdatum bis einschliesslich Enddatum und ersetzen die normalen Wochenzeiten. Sie koennen Schliesszeiten oder abweichende Oeffnungszeiten samt Anlass enthalten. Ueberlappende Ausnahmen und unvollstaendige Zeitfenster blockieren das Speichern im Editor.

Wochen- und Ausnahmetage bieten die Statusauswahl **Geoeffnet**, **Geschlossen**, **Ruhetag** und **Geschlossene Gesellschaft**. Eine geschlossene Gesellschaft gilt ganztags, wird oeffentlich entsprechend bezeichnet und nicht als Oeffnungszeit gewertet. Gespeichert wird dafuer `closed: true` zusammen mit `privateEvent: true`. Ein Ruhetag wird mit `closed: true` und `restDay: true` gespeichert und bei der naechsten Oeffnung ebenfalls uebersprungen. `restDay` und `privateEvent` schliessen sich gegenseitig aus; bestehende Daten ohne diese Felder bleiben gueltig. Beim Statuswechsel bleiben eingetragene Zeiten erhalten.

Die Sektion speichert `type: "opening-hours"` und `openingHours: { week: [...], exceptions: [...] }` in `webseite/data.json`. `week` beginnt mit Montag; jeder Tag hat `closed` und `periods` mit `start`/`end` im Format `HH:MM`. Ausnahmen ergaenzen `from`/`to` (`YYYY-MM-DD`) und `note`.

`webseite/opening-hours.js` liefert die gemeinsame Validierung und Statusberechnung in der Zeitzone `Europe/Berlin`. Die Webseite zeigt den Status und die kommenden sieben Tage, aktualisiert minuetlich sowie nach Rueckkehr zum Tab und kennzeichnet die letzten 30 Minuten vor Schliessung. Feiertage werden nicht automatisch ermittelt, sondern als Ausnahmen gepflegt. Die Uhrzeit stammt vom Besuchergeraet. iCal ist nicht Bestandteil dieser Sektion.

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
| `showInMenu` | `true`, `false` | Menueeintrag anzeigen; `false` blendet nur den Navigationseintrag aus, nicht die Sektion. Ohne Feld gilt das bisherige Verhalten anhand des Menutitels. |
| `position` | `links`, `rechts`, `zentriert` | Position des Textes gegenueber dem Bild |
| `theme` | `forest`, `moss`, `clay`, `cream` | Farbthema einer Sektion |
| `buttonLink` | `speisekarte`, `apartments`, `email`, `telefon`, `route` | Ziel eines Buttons; `telefon` verwendet `tel:+4939933736022`, `route` oeffnet Google Maps zur Warener Strasse 3, 17194 Moltzow |
| `buttonTheme` | `primary`, `secondary` | Darstellung eines Buttons |

Leere Bildwerte werden in der oeffentlichen Ausgabe nicht als Bildflaeche gerendert. Eine Instagram-Sektion hat den Typ `instagram-feed`; sie erscheint nur im Webseitentab und laedt Beitraege ueber den lokalen Endpunkt `instagram_feed.php`.

Im Webseiten- und Apartments-Editor steuert **Als Menuepunkt anzeigen: Ja / Nein** den Navigationseintrag unabhaengig vom Menutitel. Der Titel kann damit als interne Bezeichnung erhalten bleiben. Beim Laden aelterer Sektionen wird die bisherige Sichtbarkeit uebernommen; ein leerer Menutitel bleibt auch bei Auswahl von Ja ohne Navigationseintrag.

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

## Sitemap

`/sitemaps.xml` wird ueber die Rewrite-Regel in `.htaccess` dynamisch von `sitemaps.php` ausgeliefert. Beide Dateien muessen auf dem Server vorhanden sein; eine physische XML-Datei wird nicht angelegt.

Die Sitemap enthaelt die Startseite, Apartments, Speisekarte, Impressum und Datenschutz. `lastmod` stammt fuer die drei Inhaltsseiten aus dem Dateiaenderungsdatum ihrer jeweiligen `data.json`, fuer die rechtlichen Seiten aus der jeweiligen PHP-Datei. Die Zeitangaben werden in UTC ausgegeben. Aenderungen im Editor werden dadurch beim naechsten Sitemap-Abruf beruecksichtigt, ohne zusaetzliche Schreibrechte. Bei Uploads darf das alte Dateiaenderungsdatum nicht beibehalten werden, wenn ein neues `lastmod` gewuenscht ist.

Domain, Protokoll und gegebenenfalls Unterverzeichnis werden aus dem Aufruf ermittelt. Hinter einem TLS-Proxy muss der Webserver HTTPS korrekt an PHP melden. Nach Festlegung der oeffentlichen Domain kann die vollstaendige HTTPS-URL als `Sitemap:`-Eintrag in `robots.txt` hinterlegt oder direkt bei Suchmaschinen eingereicht werden.

## Saisonale Dekoration

Jeder Editor-Tab hat eigene Saison-Optionen (aktive Saison, Geschwindigkeit und Menge). Beim Oeffnen zeigt der Optionsdialog die Seite im Titel und laedt deren Einstellungen. Gespeichert wird getrennt in `webseite/season-config.json`, `speisekarte/season-config.json` und `apartments/season-config.json`.

Die Dateien werden beim ersten Speichern angelegt. PHP benoetigt dafuer Schreibrechte im jeweiligen Ordner und danach auf der Datei. `config.json` bleibt die unveraenderte Vorgabe fuer noch nicht gespeicherte Seiten: Webseite und Speisekarte uebernehmen die bisherigen Werte, Apartments startet ohne aktive Saison. Diese Dateien bei spaeteren Deployments nicht mit lokalen Testwerten ueberschreiben.

Die zugehoerigen Assets und Skripte liegen unter `seasons/`:

```text
seasons/
├── spring/
├── summer/
├── autumn/
├── winter/
├── party/
├── advent/
└── valentine/
```

**Advent** verwendet drei goldene bzw. champagnerfarbene Sterne und zwei rote Schleifen als transparente PNGs. Menge und Geschwindigkeit sind wie bei allen Seasons frei waehlbar. Die API ergaenzt Advent beim Laden bestehender Konfigurationen automatisch als inaktive Option; vorhandene Einstellungen werden nicht ueberschrieben. Zum Bereitstellen `data_handler.php` und die PNG-Dateien unter `seasons/advent/` hochladen. Der optionale Generator `seasons/advent/generate_assets.py` benoetigt Pillow und erzeugt die Motive erneut.

**Valentinstag** verwendet drei transparente Herzen in Rot, Bordeaux und Rose. Die Auswahl wird ebenfalls automatisch inaktiv ergaenzt; Menge und Geschwindigkeit bleiben frei waehlbar. Zum Bereitstellen `data_handler.php` und die drei PNG-Dateien unter `seasons/valentine/` hochladen. Der optionale Generator `seasons/valentine/generate_assets.py` nutzt Pillow und die Zeichenroutinen des Advent-Generators; die Generatoren sind fuer den Website-Betrieb nicht erforderlich.

Die API-Aktionen `load_layout_config` und `save_layout_config` erhalten den Parameter `page` (`webseite`, `speisekarte` oder `apartments`). Ohne Parameter gilt fuer alte Clients `speisekarte`. Die oeffentlichen Seiten laden dieselbe Konfiguration. PHP-Seiten aktivieren die gemeinsame Einbindung durch `$seasonPage` vor dem Header-Include; Header und Footer laden CSS, Ebene und Script. Rechtliche Seiten bleiben ohne Saison-Ebene.

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

Der Endpunkt `instagram_feed.php` ruft Beitraege serverseitig ueber die offizielle Instagram Graph API unter `graph.instagram.com` ab. Die Zugangsdaten duerfen nie im Browser, im Repository oder in JSON-Inhalten stehen.

Primaer liest der Endpunkt `account_id` und `access_token` aus `credentials.local.php`; die beiden oben beschriebenen aelteren lokalen Dateinamen funktionieren ebenfalls. Als Fallback sind Webserver-Umgebungsvariablen moeglich:

```text
INSTAGRAM_ACCOUNT_ID=...
INSTAGRAM_ACCESS_TOKEN=...
```

Das Instagram-Konto muss ein Business- oder Creator-Konto sein. Der Zugriffstoken benoetigt die passenden Meta-Berechtigungen fuer das Lesen der Medien. Der Reader liefert pro Beitrag unter anderem Bild oder Video-Vorschaubild, Beschreibung, Permalink, Zeitpunkt, Like- und Kommentaranzahl. Falls die API einen eigenen Kontokommentar liefert, wird dieser zusaetzlich als `author_comment` ausgegeben.

Die Webseite laedt ueber `webseite/script.js` bis zu drei Beitraege. Sie zeigt einen Ladezustand und bleibt bei fehlenden Zugangsdaten, API-Fehlern oder nicht verfuegbaren Beitraegen funktionsfaehig. Die Kommentar-Overlays im Frontend sind derzeit bewusst Demo-Inhalte; sie stammen nicht aus dem Instagram-Endpunkt.

## Projektstruktur

```text
.
├── index.php                 # Oeffentliche Webseite
├── apartments.php            # Apartments mit gemeinsamem Header und Footer
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
├── config.json               # Vorgabe fuer noch nicht gespeicherte Saison-Optionen
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
4. `credentials.local.php` wie im Abschnitt CMS und Anmeldung anlegen und mit eindeutigen, sicheren Zugangsdaten fuellen.
5. Fuer den Instagram-Feed Konto-ID und Zugriffstoken in derselben Datei hinterlegen.
6. Oeffentliche Seiten ueber die Startadresse, `apartments/` und `speisekarte/` aufrufen.
7. Den Editor ueber `login.php` oeffnen.

Nach Aenderungen an JavaScript oder CSS die Versionsparameter in den jeweiligen `<script>`- und `<link>`-Referenzen erhoehen, damit Browser die neue Datei abrufen.

## Abhaengigkeiten

Die Anwendung bindet externe Bibliotheken per CDN ein:

- Handlebars 4.7.8 fuer Speisekarten-Templates
- SortableJS 1.15.0 fuer Drag-and-drop im Editor
- Google Fonts: Handlee und Noto Sans

## Sicherheit und Wartung

- Zugangsdaten gehoeren ausschliesslich in eine lokale Credential-Datei oder in Webserver-Umgebungsvariablen, niemals in das Repository.
- Der Editor-Login liest Benutzername und Passwort aus der lokalen Credential-Datei und vergleicht sie zeitangriffssicher. Fuer einen erweiterten Mehrbenutzerbetrieb waeren pro Benutzer gespeicherte Passwort-Hashes erforderlich.
- `data_handler.php` ist eine schreibende API und prueft aktuell keine Session. Vor dem produktiven Betrieb muss der Zugriff serverseitig auf angemeldete Nutzer begrenzt werden.
- Archive und Server-Logs sollten nicht direkt ueber das Web erreichbar sein.
- Die Speisekarten-Speicherung setzt die Ausgabedatei auf die Rechte `0644`, damit die oeffentliche Seite sie lesen kann.
- Bei Speicherfehlern zuerst die Schreibrechte der betroffenen Daten- und Archivverzeichnisse sowie das PHP-Fehlerprotokoll pruefen.