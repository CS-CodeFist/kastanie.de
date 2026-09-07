// Container und initiale Konfiguration
const container = document.querySelector('.s-elements');
const isMobile = window.innerWidth <= 600; // Mobile Erkennung für responsive Design
const elements = []; // Array für alle Animationselemente

// Steuerungsvariablen
let total = 0;                     // Gesamtzahl der Elemente
let activeMenge = 1;               // Ausgewählte Dichteeinstellung (1-3)
let activeGeschwindigkeit = 1;     // Ausgewählte Geschwindigkeitseinstellung (1-3)

// Zeitsteuerungsvariablen
let nextElementIndex = 0;          // Index für das nächste zu aktivierende Element
let lastElementStart = 0;          // Zeitstempel der letzten Elementaktivierung
let elementStartDelay = 1000;      // Verzögerung zwischen Elementaktivierungen

// Boost-Effekte für Interaktivität
let orbitRadiusBoost = 0;          // Aktueller Boost-Wert für Umlaufbahn
let spinSpeedBoost = 0;            // Aktueller Boost-Wert für Drehgeschwindigkeit
let orbitBoostTarget = 0;          // Zielwert für Umlaufbahn-Boost
let spinBoostTarget = 0;           // Zielwert für Drehgeschwindigkeits-Boost

// Touch-Tracking für Interaktivität
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let globalBaseSpeed = 0.1;         // Basis-Fallgeschwindigkeit
let globalImages = [];             // Array für die geladenen Bilder
let animationFrameId = null;
let lastAnimationTime = null;

/**
 * Lädt saisonale Bilder basierend auf der aktiven Konfiguration
 */
async function getSeasonalImages() {
  try {
    // Lade Konfiguration mit Cache-Busting
    const configRes = await fetch("config.json?nocache=" + Date.now());
    if (!configRes.ok) throw new Error("Konnte config.json nicht laden.");

    const configList = await configRes.json();
    const active = configList.find(item => item.aktiv);

    if (!active) {
      console.warn("⚠️ Keine aktive Saison in config.json gefunden.");
      return;
    }

    const { id, geschwindigkeit, menge } = active;

    // Lade Bilder für die aktive Saison
    const imageRes = await fetch("data_handler.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "action=get_season_images&data=" + encodeURIComponent(id)
    });

    if (!imageRes.ok) {
      console.error(`❌ Fehler beim Laden der Bilddaten für '${id}'`);
      return;
    }

    globalImages = await imageRes.json();
    if (!Array.isArray(globalImages) || globalImages.length === 0) {
      console.warn(`⚠️ Keine Bilder für '${id}' gefunden.`);
      return;
    }

    // Animation nur starten, wenn Bilder vorhanden sind
    init(Number(geschwindigkeit) || 1, Number(menge) || 1);
  } catch (error) {
    console.error("💥 Fehler in getSeasonalImages():", error);
  }
}

/**
 * Initialisiert die Animation mit den angegebenen Einstellungen
 * @param {number} geschwindigkeit - Geschwindigkeitseinstellung (1-3)
 * @param {number} menge - Dichteeinstellung (1-3)
 */
function init(geschwindigkeit, menge) {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  elements.length = 0;
  container.innerHTML = '';
  lastAnimationTime = null;
  orbitRadiusBoost = 0;
  spinSpeedBoost = 0;
  orbitBoostTarget = 0;
  spinBoostTarget = 0;

  activeMenge = menge;
  activeGeschwindigkeit = geschwindigkeit;
  nextElementIndex = 0;
  lastElementStart = 0;

  // Bestimme Anzahl der Elemente basierend auf Menge-Einstellung
  const totalMap = {
    1: 2,
    2: 4,
    3: 12
  };
  total = totalMap[menge] || menge * 3;

  // Bestimme Basisgeschwindigkeit basierend auf Geschwindigkeitseinstellung
  const speedMap = {
    1: 0.06,
    2: 0.1,
    3: 0.16
  };

  // Matrix für Verzögerungskorrekturen basierend auf Menge und Geschwindigkeit
  const delayKorrekturMatrix = {
    "1-1": 0.8,
    "1-2": 0.8,
    "1-3": 0.8,
    "2-1": 0.8,
    "2-2": 0.9,
    "2-3": 0.8,
    "3-1": 0.8,
    "3-2": 0.75,
    "3-3": 0.8
  };

  const key = `${menge}-${geschwindigkeit}`;
  const korrFaktor = delayKorrekturMatrix[key] || 1.0;

  const baseSpeed = speedMap[geschwindigkeit] || 0.1;
  const screenHeight = window.innerHeight || 800;
  const fallSpeedAvg = baseSpeed;
  
  // Berechne Basisverzögerung basierend auf Bildschirmhöhe und Geschwindigkeit
  const baseDelay = (screenHeight / total * 2) / (fallSpeedAvg * korrFaktor);
  const randomFactor = 0.9 + Math.random() * 0.2;

  // Setze minimale Verzögerung von 300ms
  elementStartDelay = Math.max(baseDelay * randomFactor, 300);
  console.log(`🕒 elementStartDelay: ${Math.round(elementStartDelay)}ms`);

  // Erstelle alle Elemente
  for (let i = 0; i < total; i++) {
    // DOM-Elemente erstellen
    const el = document.createElement('div');
    el.className = 's-element';

    const inner = document.createElement('div');
    inner.className = 'inner';

    const img = document.createElement('img');

    // Zufällige Animationsparameter
    const z = Math.random();
    const spinSpeed = 0.0004 + Math.random() * 0.0003;
    const orbitRadius = 10 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;

    // Bildgröße anpassen je nach Gerät
    img.style.width = isMobile ? `${(16 + Math.random() * 16).toFixed(0)}px` : `${(24 + Math.random() * 32).toFixed(0)}px`;
    img.style.height = 'auto';

    // DOM zusammenbauen
    inner.appendChild(img);
    el.appendChild(inner);
    container.appendChild(el);

    // Horizontale Startposition bestimmen
    const zone = Math.floor(Math.random() * 5);
    const startLeft = zone * 20 + Math.random() * 20;

    // Weitere Animationsparameter
    const fallSpeed = baseSpeed * (0.9 + Math.random() * 0.2) * (0.6 + z * 0.6);
    globalBaseSpeed = baseSpeed;
    const rotationSpeed = 0.001 + Math.random() * 0.0015;
    const offset = Math.random() * 10000;

    // Element-Objekt speichern
    elements.push({
      el,
      inner,
      top: -10,
      left: startLeft,
      fallSpeed,
      rotationSpeed,
      offset,
      spinSpeed,
      orbitRadius,
      angle,
      spinAngle: Math.random() * 360,
      spinDirection: Math.random() < 0.5 ? -1 : 1,
      fastSpinSpeed: 140 + Math.random() * 100,
      active: false
    });
  }

  // Animation starten
  animate();
}

/**
 * Animationsschleife für alle Elemente
 */
function animate(now) {
  const deltaTime = lastAnimationTime === null
    ? 16.67
    : Math.min(Math.max(now - lastAnimationTime, 0), 100);
  const frameScale = deltaTime / 16.67;
  lastAnimationTime = now;

  // Boost-Effekte aktualisieren mit Easing
  orbitRadiusBoost += (orbitBoostTarget - orbitRadiusBoost) * 0.06;
  orbitBoostTarget *= 0.97; // Reduzieren des Targets (Abklingen)

  spinSpeedBoost += (spinBoostTarget - spinSpeedBoost) * 0.05;
  spinBoostTarget *= 0.96; // Reduzieren des Targets (Abklingen)

  // Neue Elemente nach Verzögerung aktivieren
  if (now - lastElementStart > elementStartDelay) {
    let loopCount = 0;

    // Suche nach inaktiven Elementen zum Aktivieren
    while (loopCount < elements.length) {
      const item = elements[nextElementIndex];
      nextElementIndex = (nextElementIndex + 1) % elements.length;
      loopCount++;

      if (!item.active) {
        item.active = true;
        item.top = -10; // Oberhalb des sichtbaren Bereichs starten
        lastElementStart = now;

        // Bild und Skalierung setzen
        const img = item.inner.querySelector('img');
        const newScale = 0.9 + Math.random() * 0.8;
        const depth = (newScale - 0.9) / 0.8;

        // Z-Index basierend auf der Skalierung setzen
        // Höherer Scale = höherer Z-Index für bessere visuelle Tiefe
        const zIndexBase = 9990;
        const zIndexOffset = Math.floor(newScale * 10);
        item.el.style.zIndex = zIndexBase + zIndexOffset;

        img.src = globalImages[Math.floor(Math.random() * globalImages.length)];
  img.style.filter = `blur(${((1 - depth) * 0.8).toFixed(2)}px)`;
        img.style.transform = `rotateX(0deg) scale(${newScale})`;
        item.currentScale = newScale;

        // Neue Fallgeschwindigkeit abhängig von Scale
        item.fallSpeed = globalBaseSpeed * (0.2 + newScale * 5) * (0.1 + Math.random() * 0.1);

        break;
      }
    }
  }

  // Alle Elemente aktualisieren
  elements.forEach(item => {
    if (item.active) {
      // Element nach unten bewegen
      item.top += item.fallSpeed * frameScale;

      // Element deaktivieren, wenn es den unteren Rand erreicht
      if (item.top > 120) {
        item.active = false;
        item.top = -10;
      }

      // Orbit-Animation aktualisieren
      item.angle += (item.spinSpeed + spinSpeedBoost) * deltaTime;

      // Animationsberechnungen
      const radius = Math.max(0, item.orbitRadius + orbitRadiusBoost);
      const isFastFalling = item.fallSpeed > globalBaseSpeed * 1.1;
      const sway = isFastFalling ? 0 : Math.cos(item.angle) * radius;
      const zSway = Math.sin(item.angle) * radius;
      const rotation = isFastFalling
        ? (item.spinAngle += item.spinDirection * item.fastSpinSpeed * deltaTime / 1000)
        : Math.sin(now * item.rotationSpeed + item.offset) * 30;
      const rotateY = Math.sin(now * item.rotationSpeed * 0.5 + item.offset) * 15;
      const bend = Math.sin(now * item.rotationSpeed + item.offset) * 40;

      // Style aktualisieren
      item.el.style.top = `${item.top}vh`;
      item.el.style.left = `${item.left}vw`;

      item.inner.style.transform = `
        translateX(${sway}px)
        translateZ(${zSway}px)
        rotate(${rotation}deg)
        rotateY(${rotateY}deg)
      `;

      const img = item.inner.querySelector('img');
      img.style.transform = `rotateX(${bend}deg) scale(${item.currentScale || 1})`;
    } else {
      // Inaktive Elemente außerhalb des sichtbaren Bereichs platzieren
      item.el.style.top = `-100vh`;
    }
  });

  // Nächsten Frame anfordern
  animationFrameId = requestAnimationFrame(animate);
}

// Touch-Event-Handler für Interaktivität
window.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
}, { passive: true });

window.addEventListener('touchend', e => {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dt = Math.max(Date.now() - touchStartTime, 1);

  // Berechne Geschwindigkeit der Geste
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = distance / dt;

  // Boost-Effekte basierend auf Gestengeschwindigkeit setzen
  orbitBoostTarget = 100 * speed + Math.random() * 50;
  spinBoostTarget = 0.01 * speed + Math.random() * 0.003;
});

// Animation starten
getSeasonalImages();