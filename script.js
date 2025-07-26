// Template-Cache für Handlebars
const templateCache = new Map();

function renderTemplate(templateId, values) {
	// Template aus Cache laden oder kompilieren
	if (!templateCache.has(templateId)) {
		const templateElement = document.getElementById(templateId);
		if (!templateElement) {
			console.error(`Template ${templateId} nicht gefunden`);
			return '';
		}
		const templateSource = templateElement.innerHTML;
		const compiledTemplate = Handlebars.compile(templateSource);
		templateCache.set(templateId, compiledTemplate);
	}

	const template = templateCache.get(templateId);
	return template(values);
}

// Handlebars Helper für Preisformatierung
Handlebars.registerHelper('formatPreis', function(value) {
	return formatPreis(value);
});

// Handlebars Helper für Zeilenumbrüche
Handlebars.registerHelper('nl2br', function(text) {
	if (!text) return '';
	return new Handlebars.SafeString(text.replace(/\r?\n/g, '<br>'));
});

function formatPreis(value) {
	const number = parseFloat(value);
	if (isNaN(number)) return value;
	return number.toFixed(2).replace(".", ",");
}

const timestamp = new Date().getTime();
fetch(`data.json?t=${timestamp}`)
  .then(response => response.json())
  .then(data => {
    document.getElementById("loader").style.display = "none";

    const menuContainer = document.getElementById("menu");
    const contentContainer = document.getElementById("content");

    // Logo-Beschreibung finden
    const logoItem = data.content.find(item => item.menutitel.toLowerCase() === "logo");
    const logoBeschreibung = logoItem?.beschreibung || null;
    
    let isFirstNormalMenu = true; // Tracker für das erste normale Menü

    data.content.forEach((item) => {
        const isLogo = item.menutitel.toLowerCase() === "logo";
        const isInfotext = item.menutitel.toLowerCase() === "infotext";
       
        // Logo im Menü anzeigen, aber infotext nicht
        if (!isInfotext) {
        const html = renderTemplate("template-menu-item", {
            ...item,
            isLogo: isLogo,
            link: isLogo ? (item.titel || "http://www.kastanie-moltzow.de") : "#"+item.menutitel.toLowerCase()
        });            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();
            const linkElement = wrapper.firstChild;

            menuContainer.appendChild(linkElement);
        }

        if (Array.isArray(item.gerichte) && item.gerichte.length > 0) {
            // Gerichte-Daten für Handlebars vorbereiten
            const processedGerichte = item.gerichte.map(gericht => ({
                ...gericht,
                zusatzstoffe: Array.isArray(gericht.zusatzstoffe) ? gericht.zusatzstoffe.join(", ") : gericht.zusatzstoffe
            }));
        
            const sectionHTML = renderTemplate("template-section", {
                link: item.menutitel.toLowerCase(),
                image: item.image,
                titel: item.titel,
                gerichte: processedGerichte,
                isLogo: isFirstNormalMenu, // Logo-Beschreibung nur beim ersten normalen Menü
                beschreibung: isFirstNormalMenu ? logoBeschreibung : null
            });
        
            contentContainer.insertAdjacentHTML("beforeend", sectionHTML);
            isFirstNormalMenu = false; // Nach dem ersten normalen Menü auf false setzen
        } else if (isInfotext && item.beschreibung) {
            // Infotext als speziellen Bereich rendern
            const infotextHTML = renderTemplate("template-infotext", {
                beschreibung: item.beschreibung,
                image: item.image
            });
            contentContainer.insertAdjacentHTML("beforeend", infotextHTML);
        }
    });
      
    const sections = document.querySelectorAll(".section-content");
    const menuLinks = document.querySelectorAll(".menu a");
    
    const scrollContainer = document.querySelector(".container");
    let lastScrollTime = 0;
    let scrollEnabled = true;
    
    scrollContainer.addEventListener("scroll", () => {
        if (!scrollEnabled) return;
        const now = Date.now();
        if (now - lastScrollTime > 100) {
        lastScrollTime = now;
        setActiveByScroll();
        }
    });
    
    function setActiveByScroll() {
        const fromTop =
        scrollContainer.scrollTop + scrollContainer.clientHeight;
        let currentSectionId = null;
    
        sections.forEach((section) => {
        const offsetTop = section.offsetTop;
        if (fromTop >= offsetTop) {
            currentSectionId = section.id;
        }
        });
    
        if (currentSectionId) {
        menuLinks.forEach((link) => {
            const isActive =
            link.getAttribute("href").substring(1) === currentSectionId;
            link.classList.toggle("active", isActive);
            if (isActive) {
            link.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
            }
        });
        }
    }
      
    menuLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetId);

            // wenn der Link ein Logo ist, dann auf den hinterlegten Link gehen
            // ansonten scrollen
            if (targetSection !== null) {
                e.preventDefault();

                if (targetSection) {
                    scrollEnabled = false;
                    // Etwas oberhalb der Section scrollen für bessere Sichtbarkeit
                    const offset = 500;
                    scrollContainer.scrollTo({
                        top: Math.max(0, targetSection.offsetTop - offset),
                        behavior: "smooth",
                    });
            
                    setTimeout(() => {
                        scrollEnabled = true;
                        setActiveByScroll();
                    }, 800); // Wartezeit anpassen bei Bedarf
                }
            
                menuLinks.forEach((l) => l.classList.remove("active"));
                link.classList.add("active");
            
                link.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                });
            }
        });
            
    });
    
    window.addEventListener("load", () => {
        setActiveByScroll(); // beim Laden prüfen
    });
      
  })
  .catch(error => {
    console.error("Fehler beim Laden der Daten:", error);
  });

// Dark Mode Toggle direkt initialisieren, sobald das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    initDarkModeToggle();
});

// Zusätzliche Initialisierung bei window.load
window.addEventListener('load', () => {
    initDarkModeToggle();
});

// Dark Mode Toggle Funktionalität
function initDarkModeToggle() {
    const toggleButton = document.getElementById('darkModeToggle');
    if (!toggleButton) return;

    // Aktuellen Modus vom System oder localStorage laden
    const savedMode = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentMode;
    if (savedMode) {
        currentMode = savedMode;
    } else {
        currentMode = systemPrefersDark ? 'dark' : 'light';
    }
    
    updateDarkMode(currentMode);
    toggleButton.setAttribute('data-mode', currentMode);
    
    // Click Handler
    toggleButton.addEventListener('click', () => {
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        currentMode = newMode;
        updateDarkMode(newMode);
        toggleButton.setAttribute('data-mode', newMode);
        localStorage.setItem('darkMode', newMode);
    });
    
    // System-Präferenz-Änderungen überwachen (falls kein manueller Modus gesetzt)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('darkMode')) {
            const newMode = e.matches ? 'dark' : 'light';
            currentMode = newMode;
            updateDarkMode(newMode);
            toggleButton.setAttribute('data-mode', newMode);
        }
    });
}

function updateDarkMode(mode) {
    if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}