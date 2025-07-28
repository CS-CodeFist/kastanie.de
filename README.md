# Kastanie.de - Digitale Speisekarte

Elegante, responsive Speisekarte mit Parallax-Effekten, Dark Mode und saisonalen Animationen.

## ✨ Features

- **Parallax-Scrolling** mit 3D-Transformationen
- **Glasmorphismus** mit backdrop-filter Effekten
- **Dark/Light Mode** - Automatische Systemerkennung + manueller Toggle
- **Responsive Design** für alle Geräte
- **Saisonale Animationen** (Frühling, Sommer, Herbst, Winter, Party)
- **Editor-Interface** zur Speisekarten-Verwaltung
- **Intelligente Bildverarbeitung** mit automatischer Optimierung
- **Flexible Preisstruktur** mit verschiedenen Größen
- **Kastanie-SVG Hintergrund** als Branding-Element
- **Konfigurierbare Zusatzstoffe-Titel** für individuelle Beschriftungen
- **Social Media Integration** - Instagram und Google Bewertungs-Links
- **Pattern-basierte Links** - `[instagram]` und `[google]` Tags in Beschreibungen

## 🔧 Tech Stack & Externe Dependencies

### Frontend
- **Handlebars.js 4.7.8** - Template Engine von CDN
  ```html
  <script src="https://cdn.jsdelivr.net/npm/handlebars@4.7.8/dist/handlebars.min.js"></script>
  ```
- **SortableJS 1.15.0** - Drag & Drop Funktionalität im Editor
  ```html
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  ```
- **Google Fonts** - Handlee & Noto Sans
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Handlee&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap">
  ```

### Backend
- **PHP 7.4+** - Server-seitige Logik
- **GD Extension** - Bildverarbeitung
- **JSON** - Datenhaltung

## 📸 Bildverarbeitungs-Pipeline

### Upload-Prozess (`data_handler.php`)
1. **Upload-Validierung**: MIME-Type und Dateigröße prüfen
2. **Format-Unterstützung**: JPEG, PNG, GIF → WebP Konvertierung
3. **EXIF-Korrektur**: Automatische Rotation basierend auf EXIF-Daten
4. **Größenoptimierung**: Resize auf max. 1600px (längste Seite)
5. **Quadratischer Zuschnitt**: Zentriertes Cropping für einheitliche Darstellung
6. **WebP-Komprimierung**: 80% Qualität für optimale Dateigröße
7. **Zeitstempel-Benennung**: `originalname_timestamp.webp` für Eindeutigkeit

### Archivierungs-System
- **Automatische Archivierung**: Alte Bilder in `/bilder_menu/archiv/`
- **Datei-Management**: Upload, Löschen, Archivieren über Editor
- **Base64-Vorschau**: Direkte Bildanzeige im Editor ohne separate Requests

### Bilddarstellung
- **Responsive Images**: `max-width: 100%` mit Media Query Anpassungen
- **Optimierte Performance**: WebP-Format für moderne Browser
- **Cross-Browser Kompatibilität**: WebP wird von 95%+ der Browser unterstützt
- **SVG-Integration**: Kastanie-Hintergrundbild als skalierbare Vektorgrafik

## 🔗 Social Media Integration

### Pattern-basierte Link-Generierung
Das System unterstützt automatische Link-Erstellung durch spezielle Pattern in Beschreibungstexten:

- **Instagram-Links**: `[instagram]` → Automatischer Link zu `https://www.instagram.com/kastaniemoltzow/`
- **Google-Bewertungen**: `[google]` → Link zur Google-Bewertungsseite
- **Icon-Integration**: Externe SVG-Icons (`bilder/instagram-icon.svg`, `bilder/google-icon.svg`)
- **Hover-Effekte**: Scale-Animation und Farbänderungen bei Mouse-Over

### Handlebars Helper
```javascript
// processInstagramText Helper verarbeitet beide Pattern
{{{processInstagramText beschreibung}}}
```

Unterstützte Pattern:
- `[instagram]` - Instagram-Icon mit Link
- `[google]` - Google-Icon mit Link zu Bewertungen

## 🎯 Editor Features

### Content Management
- **Drag & Drop Sortierung** für Menüs und Gerichte
- **Live-Vorschau** während der Bearbeitung
- **Template-System** für wiederverwendbare Speisekarten-Layouts
- **Archiv-Funktionalität** mit Versionsverwaltung
- **Bulk-Operations** für effiziente Content-Verwaltung

### Erweiterte Funktionen
- **Konfigurierbare Zusatzstoffe-Titel** (z.B. "Inhaltsstoffe", "Allergene", "Zusätze")
- **Mehrsprachige Unterstützung** durch Template-basierte Struktur
- **Preislisten-Management** mit bis zu 3 Größenvarianten pro Gericht
- **Beilagen-System** mit individuellen Aufpreisen
- **Tag-System** für besondere Kennzeichnungen (Neu, Empfehlung, etc.)

### Benutzerfreundlichkeit
- **Kollabierbare Sektionen** für bessere Übersicht bei großen Menüs
- **Sticky Headers** in langen Listen
- **Tastatur-Navigation** und Accessibility-Features
- **Auto-Save Funktionalität** verhindert Datenverlust

## 📁 Struktur

```
├── index.html          # Haupttemplate mit Handlebars
├── styles.css          # 3D-Parallax & Glasmorphismus
├── script.js           # Frontend-Logik & Handlebars Helpers
├── data_handler.php    # Upload & Bildverarbeitung
├── editor.php          # Backend-Editor Interface
├── editor.js           # Editor-Logik & Template-Rendering
├── editor.css          # Editor-Styling & Responsive Design
├── data.json           # Speisekarten-Daten
├── config.json         # Saison-Layout Konfiguration
├── bilder/             # SVG-Assets & Icons
│   ├── Kastanie.svg   # Haupt-Branding-Logo
│   ├── instagram-icon.svg # Instagram-Icon für Links
│   └── google-icon.svg    # Google-Icon für Bewertungen
├── bilder_menu/        # Optimierte WebP-Bilder
│   └── archiv/        # Archivierte Bilder
├── templates/          # Speisekarten-Vorlagen
│   └── archiv/        # Archivierte Templates
└── seasons/            # Saisonale Dekorationen
    ├── spring/        # Blüten-Animationen
    ├── summer/        # Sommer-Effekte
    ├── autumn/        # Herbst-Blätter
    ├── winter/        # Schneeflocken
    └── party/         # Konfetti-Partikel
```

## 📱 Responsive

- **Mobile**: < 600px - Bilder 100% Container-Breite
- **Tablet**: 601-1024px - Bilder max. 300px Breite
- **Desktop**: > 1025px - Bilder 100% mit Container-Limits

## 🎨 Design

### Farben - Light Mode
- **Primary Green**: `#7ea12c` - Hauptakzentfarbe
- **Warm Beige**: `#DFCB97` - Hintergrundfarbe 
- **Dark Brown**: `#291d11` - Textfarbe

### Farben - Dark Mode
- **Primary Green**: `#9bc53d` - Hellerer Akzent für besseren Kontrast
- **Dark Background**: `#2d2922` - Warmer dunkler Hintergrund
- **Light Text**: `#DFCB97` - Warmer Beige-Ton für Text


## 🚀 Setup

1. **Server-Anforderungen**
   - PHP 7.4+ mit GD Extension
   - Schreibrechte für `/bilder_menu/` und `/templates/`
   - Moderne Browser für backdrop-filter Support

2. **Installation**
   ```bash
   chmod 755 bilder_menu/
   chmod 755 bilder/
   chmod 644 data.json
   ```

3. **Zugriff**
   - `index.html` - Öffentliche Speisekarte
   - `editor.php` - Admin-Interface
   - Login-Credentials in `login.php`

*Entwickelt für die digitale Gastronomie mit Fokus auf moderne Web-Standards und optimale User Experience* 🌰
