# Kastanie.de - Digitale Speisekarte

Elegante, responsive Speisekarte mit Parallax-Effekten, Dark Mode und saisonalen Animationen.

## ✨ Features


## 🔧 Tech Stack & Externe Dependencies

### Frontend
  ```html
  <script src="https://cdn.jsdelivr.net/npm/handlebars@4.7.8/dist/handlebars.min.js"></script>
  ```
  ```html
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  ```
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Handlee&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap">
  ```

### Backend

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

### Bilddarstellung

## 🔗 Social Media Integration

### Pattern-basierte Link-Generierung
Das System unterstützt automatische Link-Erstellung durch spezielle Pattern in Beschreibungstexten:


### Handlebars Helper
```javascript
// processInstagramText Helper verarbeitet beide Pattern
{{{processInstagramText beschreibung}}}
```

Unterstützte Pattern:

## 🎯 Editor Features

### Content Management

### Erweiterte Funktionen

### Benutzerfreundlichkeit

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


## 🎨 Design

### Farben - Light Mode

### Farben - Dark Mode


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
