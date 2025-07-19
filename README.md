# Kastanie.de - Digitale Speisekarte

Elegante, responsive Speisekarte mit Parallax-Effekten und saisonalen Animationen.

## ✨ Features

- **Parallax-Scrolling** mit 3D-Transformationen
- **Glasmorphismus** mit backdrop-filter Effekten
- **Responsive Design** für alle Geräte
- **Saisonale Animationen** (Frühling, Sommer, Herbst, Winter, Party)
- **Editor-Interface** zur Speisekarten-Verwaltung
- **Intelligente Bildverarbeitung** mit automatischer Optimierung
- **Flexible Preisstruktur** mit verschiedenen Größen
- **Kastanie-SVG Hintergrund** als Branding-Element

## 🔧 Tech Stack & Externe Dependencies

### Frontend
- **Handlebars.js 4.7.8** - Template Engine von CDN
  ```html
  <script src="https://cdn.jsdelivr.net/npm/handlebars@4.7.8/dist/handlebars.min.js"></script>
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
- **Lazy Loading**: Optimierte Performance durch bedarfsgerechtes Laden
- **Format-Optimierung**: WebP für moderne Browser, Fallbacks für ältere

## 📁 Struktur

```
├── index.html          # Haupttemplate mit Handlebars
├── styles.css          # 3D-Parallax & Glasmorphismus
├── script.js           # Frontend-Logik & Handlebars Helpers
├── data_handler.php    # Upload & Bildverarbeitung
├── editor.php          # Backend-Editor Interface
├── data.json           # Speisekarten-Daten
├── bilder_menu/        # Optimierte WebP-Bilder
│   └── archiv/        # Archivierte Bilder
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

### Farben
- Primary Green: `#7ea12c`
- Warm Beige: `#DFCB97`
- Dark Brown: `#291d11`

### Fonts
- **Handlee** - Überschriften (Google Fonts)
- **Noto Sans** - Text (Google Fonts)

## 🚀 Setup

1. **Server-Anforderungen**
   - PHP 7.4+ mit GD Extension
   - Schreibrechte für `/bilder_menu/` und `/templates/`
   - Moderne Browser für backdrop-filter Support

2. **Installation**
   ```bash
   chmod 755 bilder_menu/
   chmod 755 logs/
   chmod 644 data.json
   ```

3. **Zugriff**
   - `index.html` - Öffentliche Speisekarte
   - `editor.php` - Admin-Interface
   - Login-Credentials in `login.php`

## ⚠️ Browser-Support

- **Chrome/Safari**: Vollständig (backdrop-filter + 3D transforms)
- **Firefox/Edge**: Vollständig  
- **Ältere Browser**: `backdrop-filter` Fallback auf Transparenz
- **Mobile**: Optimiert für Touch-Interfaces

---

*Entwickelt für die digitale Gastronomie* 🌰
