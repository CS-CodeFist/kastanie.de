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

Webseite und Apartments verwenden den gemeinsamen PHP-Renderer `partials/website.php`. Inhalte, Navigation, erste Ueberschrift als H1, Bilder, Kartenfreigabe und initiale Oeffnungszeiten stehen bereits in der HTML-Antwort. Der Browser laedt dafuer keine Inhalts-JSONs mehr. `scripts/website.js` ergaenzt Navigation beim Scrollen, laufende Oeffnungszeiten und den Instagram-Feed. Die gemeinsamen Module fuer Theme und Logo (`scripts/theme.js`), Oeffnungszeiten (`scripts/opening-hours.js`) und Karten (`scripts/map.js`) liegen ebenfalls in `scripts/`. Editor-Module bleiben in `editor/`; `editor/main.js` koordiniert sie. Editor, Vorlagen und die JavaScript-basierte Speisekarte bleiben unveraendert.

Das gemeinsame Stylesheet `styles.css` liegt im Projektverzeichnis und wird von Startseite, Apartments, Impressum und Datenschutz verwendet. Seine Bildpfade zeigen auf `bilder/`. Die eigenstaendigen Stylesheets fuer Editor, Speisekarte und saisonale Effekte bleiben in ihren jeweiligen Ordnern.

Startseite, Apartments und rechtliche Seiten binden `partials/header.php` und `partials/footer.php` ein. Weitere PHP-Seiten setzen vor dem Header-Include ihren `$pageTitle`, `$pageDescription` und `$pagePath`. Die Inhaltsseiten laden davor `partials/website.php` und erstellen `$website = new WebsiteRenderer('webseite')` bzw. `new WebsiteRenderer('apartments')`. Der Header gibt mit `$website->navigation()` die Abschnittslinks aus, im Hauptinhalt folgt `$website->render()`. `$hasSectionNavigation` und `$navigationLabel` steuern die Navigation. `$baseHref` ist optional und wird fuer die Apartments-Adresse mit abschliessendem Slash auf `../` gesetzt; deren Abschnittslinks enthalten deshalb auch den Seitenpfad.

### Bildcache der Inhaltsseiten

Base64-Bilder bleiben fuer Editor und Archive unveraendert im JSON. Der PHP-Renderer prueft Bildtyp und Abmessungen und legt JPEG-, PNG-, GIF- und WebP-Dateien atomar unter `bilder/cache/<sha256>.<endung>` ab. Es findet keine erneute verlustbehaftete Komprimierung statt. Identische Bilder teilen sich eine Datei; geaenderte Bilder erhalten eine neue URL. Vorhandene normale Bild-URLs werden ebenfalls unterstuetzt. HTML enthaelt echte `img`-Elemente mit Abmessungen, sofern aus dem eingebetteten Bild ermittelbar. Das erste Bild laedt sofort, weitere Bilder verzögert. `object-fit: cover` erhaelt die bisherigen Ausschnitte. Ein optionales `imageAlt` wird als Alternativtext verwendet; ohne redaktionell gepflegten Alternativtext bleiben die bislang dekorativen Hintergrundbilder dekorativ (`alt=""`).

**Deployment:** `partials/website.php`, `index.php`, `apartments.php`, `partials/header.php`, `scripts/website.js`, `scripts/map.js`, `styles.css` und `bilder/cache/.htaccess` zusammen hochladen. Der Ordner `bilder/cache/` muss fuer den PHP-Prozess schreibbar sein; alternativ muss PHP ihn unter `bilder/` anlegen duerfen. Keine pauschalen 0777-Rechte vergeben. Die generierten Bilder muessen nicht hochgeladen werden, sie entstehen beim ersten Seitenaufruf aus den vorhandenen JSONs. Keine Inhalts-JSONs, Zugangsdaten oder Editor-Dateien ersetzen.

`bilder/cache/.htaccess` setzt, sofern Apache `mod_headers` verfuegbar ist, fuer Hash-Bildnamen ein Jahr Cachezeit mit `immutable`. Erzeugte Bilddateien sind von Git ausgeschlossen. Bei fehlenden Schreibrechten bleibt der Text verfuegbar, das betroffene Bild wird ausgelassen und ein Fehler im PHP-Log vermerkt. Alte Cachebilder werden nicht automatisch geloescht, damit bereits ausgelieferte HTML-Seiten ihre Bilder behalten. Ein vollstaendig geleerter Cache wird beim naechsten Aufruf neu aufgebaut, kann aber alte, noch geoeffnete Seiten beeintraechtigen.

Die oeffentliche Apartments-Adresse bleibt `/apartments/`. `.htaccess` leitet auch bisherige HTML-Links und direkte Aufrufe von `apartments.php` dorthin weiter. Bei der Umstellung `apartments.php` und den gemeinsamen Header zuerst hochladen, danach `.htaccess` aktualisieren und die alte `apartments.html` auf dem Server entfernen.

## Lokale Schriftarten und Bibliotheken

Oeffentliche Seiten laden Handlee und Noto Sans ueber `vendor/fonts/fonts.css`. Handlee ist regulaer, Noto Sans als variable Schrift mit Gewichten 100-900 in normaler und kursiver Form vorhanden. Die 17 WOFF2-Dateien enthalten die von Google Fonts bereitgestellten Sprachbereiche; `unicode-range` und `font-display: swap` bleiben erhalten. Quelle ist die Google-Fonts-CSS-API fuer diese Familien, Download am 21.09.2026; die Originaldateinamen enthalten die Font-Version. Beide SIL-OFL-Lizenzen liegen im selben Verzeichnis. Es gibt keine externe Font-Einbindung oder Google-Preconnects mehr.

Handlebars 4.7.8 liegt unter `vendor/handlebars/handlebars-4.7.8.min.js`, SortableJS 1.15.0 unter `vendor/sortablejs/Sortable-1.15.0.min.js`. Die fertigen Originaldateien und MIT-Lizenzen stammen aus den gleichnamigen npm-Paketen, heruntergeladen ueber jsDelivr. Speisekarte und Editor verwenden ausschliesslich die lokalen Dateien; die Bibliotheksversionen wurden nicht geaendert. Updates erfolgen manuell samt Lizenzdateien und anschliessender Funktionspruefung, ohne Build.

**Deployment:** Zuerst die vollstaendigen neuen Ordner `vendor/fonts/`, `vendor/handlebars/` und `vendor/sortablejs/` inklusive Lizenzen hochladen, danach `partials/header.php`, `speisekarte.html`, `editor.php` und `datenschutz.php`. Vorhandene `vendor/leaflet/`- und `vendor/maplibre/`-Dateien behalten. Instagram-Medien werden weiterhin extern geladen; OpenFreeMap-Kartendaten weiterhin erst nach Freigabe. Diese Umstellung macht daher nicht die gesamte Website frei von externen Anfragen.

## Metadaten und Icons

Der gemeinsame PHP-Header erzeugt `og:image` und `twitter:image` aus dem aktuellen HTTP-/HTTPS-Protokoll, dem validierten Host und dem Installationsverzeichnis (`SCRIPT_NAME`). Damit ist das Vorschaubild auch auf Testdomains und in Unterordnern erreichbar. Canonical, `og:url` und Restaurant-Identitaet bleiben auf der Hauptdomain. Nicht vertrauenswuerdige Forwarded-Header werden nicht ausgewertet; bei HTTPS-Terminierung an einem Reverse Proxy muss der Server HTTPS korrekt an PHP melden. Die eigenstaendige HTML-Speisekarte behaelt ihre festen Bild-URLs. Messenger koennen bereits erzeugte Linkvorschauen zwischenspeichern.

Die oeffentlichen Seiten enthalten individuelle Titel, Beschreibungen und kanonische URLs fuer `https://www.bistro-kastanie.de`. Open-Graph- und Twitter-Card-Metadaten verweisen auf das gemeinsame PNG-Vorschaubild mit 1200 x 630 Pixeln. Die Startseite enthaelt zusaetzlich strukturierte Restaurantdaten (JSON-LD), die `WebsiteRenderer::restaurantSchema()` in `partials/website.php` erzeugt und `partials/header.php` sicher als JSON ausgibt. Name und Adresse werden in dieser Renderer-Methode gepflegt. Die Telefonnummer stammt aus demselben Telefon-Link wie die oeffentlichen Abschnittsbuttons; frei geschriebene Kontakttexte und das Impressum muessen bei einer Nummernaenderung weiterhin abgeglichen werden. `WebsiteRenderer::LOCATION` versorgt sowohl `geo` im Schema als auch die Koordinaten des interaktiven Kartenmarkers. Bei Standortaenderungen muessen die Karten-Vorschaubilder separat erneuert werden.

`openingHoursSpecification` stammt aus der ersten sichtbaren Sektion vom Typ `opening-hours` in `webseite/data.json`. Mehrere Zeitfenster werden als einzelne Eintraege ausgegeben. Geschlossene Tage, Ruhetage und geschlossene Gesellschaften erhalten `opens: "00:00"` und `closes: "00:00"`. Gepflegte datierte Ausnahmen erscheinen als `specialOpeningHoursSpecification` mit `validFrom` und `validThrough`; abgelaufene Ausnahmen werden anhand von `Europe/Berlin` nicht mehr ausgegeben. Fehlende oder ungueltige Zeiten fuehren zum Weglassen der Zeitangaben im Schema, nicht zu erfundenen Oeffnungszeiten. Aenderungen im Editor werden beim naechsten Seitenaufruf uebernommen. Apartments und Speisekarte erhalten kein zusaetzliches Restaurant-Schema.

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

`scripts/opening-hours.js` liefert die gemeinsame Validierung und Statusberechnung in der Zeitzone `Europe/Berlin` fuer die oeffentlichen Seiten und den Editor. PHP liefert Status und kommende sieben Tage bereits anhand der Serverzeit aus. JavaScript aktualisiert die Anzeige anhand der Besucherzeit minuetlich sowie nach Rueckkehr zum Tab und kennzeichnet die letzten 30 Minuten vor Schliessung. Beide Berechnungen verwenden `Europe/Berlin`; ohne JavaScript bleibt der Stand des Seitenaufrufs sichtbar. Feiertage werden nicht automatisch ermittelt, sondern als Ausnahmen gepflegt. iCal ist nicht Bestandteil dieser Sektion.

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

Leere Bildwerte werden in der oeffentlichen Ausgabe nicht als Bildflaeche gerendert, ausser bei `mediaType: "openstreetmap"` (auch bisheriges `apple-map` wird als Karte gelesen). Eine Instagram-Sektion hat den Typ `instagram-feed`; sie erscheint nur im Webseitentab und laedt Beitraege ueber den lokalen Endpunkt `instagram_feed.php`.

Im Bildauswahldialog von Webseite und Apartments ist **Karte** mit heller Kartenvorschau auswaehlbar. Die Auswahl speichert `mediaType: "openstreetmap"` und `image: ""`; Bildauswahl oder Entfernen loescht `mediaType` wieder. Bestehende Inhaltsdateien werden nicht automatisch geaendert. Karten verwenden dieselbe Bildflaeche und Textposition wie normale Bilder.

Vor der Freigabe werden ausschliesslich die gemeinsamen lokalen Vorschaubilder `bilder/map-light-kastanie.webp` (hell) und `bilder/map-dark-kastanie.webp` (dunkel) angezeigt. Die Quellenangaben stehen als Links direkt am Bild. Beide Bilder enthalten das Kastanienlogo und wurden mit 1000 x 600 Pixeln am unten genannten Mittelpunkt aufgenommen: Leaflet-Zoom 10 entspricht MapLibre-Zoom 9. Die Vorschau wird responsiv zentriert zugeschnitten. Bei Aenderungen von Mittelpunkt, Startzoom oder Kartenstil beide Bilder erneuern und mit hochladen. Nach dem Schliessen der interaktiven Karte erscheint wieder die lokale Vorschau.

Das gemeinsame Kartenmodul `scripts/map.js` laedt Leaflet 1.9.4 aus `vendor/leaflet/` sowie MapLibre GL JS 5 und den Leaflet-Adapter 0.1.3 aus `vendor/maplibre/` erst nach Klick auf **Karte laden**. Erst dann werden Stile, Vektorkacheln, Symbole und Kartenschriftarten von `https://tiles.openfreemap.org/` angefordert. Es gibt keinen Token, keine Standortabfrage und keine gespeicherte Freigabe. **Karte schliessen** entfernt die Karteninstanz und den Theme-Beobachter und widerruft die Freigabe fuer weitere Kartenanfragen. Jede Karte und jeder neue Seitenaufruf benoetigen eine eigene Freigabe. Ladefehler oder fehlende WebGL-Unterstuetzung bieten eine Wiederholung.

Der vorlaeufige Mittelpunkt ist 53.631393, 12.569870, basierend auf dem OSM-Restaurantobjekt [Zur Kastanie, Warener Strasse 3](https://www.openstreetmap.org/way/325068598). Zoom 10 ist der Ausgangswert fuer eine Uebersicht der Umgebung; den genauen Eingang vor Veroeffentlichung abstimmen. Beide Kartenstile verwenden die Website-Palette und basieren auf OpenFreeMap **Liberty**, Stand 20.09.2026. `scripts/map-dark.json` ist von `scripts/map-light.json` abgeleitet, mit denselben 111 Ebenen, Zoomregeln und Symbolen. Im dunklen Stil ist die Natural-Earth-Rasterebene ausgeblendet und das Sumpfmuster durch Braun ersetzt, damit Landflaechen auch bei anderen Zoomstufen nicht gruen erscheinen. Hell: Menue-Hintergrund und Textkonturen in Creme `#dfcb97`, Schrift `#291d11` sowie Wald-/Moosgruen `#7ea12c` und `#607d22`. Dunkel: gegenueber der Menuefarbe abgedunkelter Grund und Textkonturen `#24211b`, Ortsnamen `#dfcb97`, Strassen und Autobahnen `#b5a47e`, Landflaechen in dunklen Brauntoenen `#493c2c`, `#594932` und `#3b3226` mit abgestufter Deckkraft sowie Gebaeude und Strassenkonturen `#1e1b17`. Gruen bleibt ausschliesslich den Gewaessern vorbehalten: Wasserflaechen `#3d4e1d`, Wasserlaeufe `#53671e`. Der Marker bleibt unveraendert hell, um sich deutlicher abzuheben. Farben sind in den JSON-Dateien hinterlegt und nicht automatisch an CSS-Variablen gekoppelt. Datenquellen bleiben erhalten. Beide JSON-Dateien mit hochladen; bei Aenderungen auch die Stil-Cacheversionen in `scripts/map.js` aktualisieren und die jeweilige Vorschau neu erzeugen. Eine geladene Karte folgt Aenderungen von `data-theme`, ohne Mittelpunkt, Zoom oder Marker zurueckzusetzen. Vor der Freigabe loest ein Themewechsel keine Kartenanfragen aus.

Die [OpenFreeMap-Nutzungsbedingungen](https://openfreemap.org/tos/) und Quellenangaben fuer OpenMapTiles/OpenStreetMap sind einzuhalten. Der kostenlose Dienst erlaubt gewerbliche Nutzung, bietet aber keine Verfuegbarkeitsgarantie. Die Datenschutzerklaerung wurde um den neuen Kartenanbieter ergaenzt und ist vor Veroeffentlichung rechtlich zu pruefen. Fuer den Upload beide kompletten Ordner `vendor/leaflet/` und `vendor/maplibre/` inklusive Bildern und Lizenzen sowie `scripts/map.js` und die beiden Vorschaubilder in `bilder/` mitnehmen. Die Bibliotheken wurden als fertige Laufzeitdateien aus npm uebernommen; kein Build notwendig.

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

Der Upload akzeptiert JPEG, PNG, GIF und WebP. Der Server korrigiert bei JPEG moegliche EXIF-Ausrichtung, skaliert die laengste Kante auf maximal 1600 Pixel und speichert als WebP mit 80 Prozent Qualitaet. Webseite und Apartments behalten dabei das Seitenverhaeltnis des Originals; nur Speisekartenbilder werden zentriert quadratisch zugeschnitten. Bestehende Bilder bleiben unveraendert; bereits zugeschnittene Bilder muessen bei Bedarf aus dem Original neu hochgeladen und im Editor neu ausgewaehlt werden. Die Bildflaechen auf der Website koennen durch `object-fit: cover` weiterhin einen Ausschnitt zeigen. Nicht mehr benoetigte Bilder werden in den Archiv-Unterordner der jeweiligen Bibliothek verschoben.

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

Die Webseite laedt ueber `scripts/website.js` bis zu drei Beitraege. Sie zeigt einen Ladezustand und bleibt bei fehlenden Zugangsdaten, API-Fehlern oder nicht verfuegbaren Beitraegen funktionsfaehig. Die Kommentar-Overlays im Frontend sind derzeit bewusst Demo-Inhalte; sie stammen nicht aus dem Instagram-Endpunkt.

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