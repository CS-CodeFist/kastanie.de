// ===== EDITOR CORE - Grundlegende Funktionen =====
// Globale Variablen und Cache
let savedScrollPosition = 0;
const templateCache = new Map();

// ===== TEMPLATE-SYSTEM =====
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

// ===== HANDLEBARS HELPER =====
// Handlebars Helper für Preisformatierung
Handlebars.registerHelper('formatPreis', function(value) {
	return formatPreis(value);
});

// Handlebars Helper für Array-Join
Handlebars.registerHelper('join', function(array, separator) {
	if (!Array.isArray(array)) return '';
	return array.join(separator || ', ');
});

// ===== HILFSFUNKTIONEN =====
function formatPreis(value) {
	const number = parseFloat(value);
	if (isNaN(number)) return value;
	return number.toFixed(2).replace(".", ",");
}

// ===== OVERLAY-MANAGEMENT =====
// Hilfsfunktionen für sanfte Overlay-Animationen
function showOverlay(overlayElement) {
	// Support für String (Element-ID) oder direktes Element
	if (typeof overlayElement === 'string') {
		overlayElement = document.getElementById(overlayElement);
	}
	
	overlayElement.style.display = "flex";
	// Kleine Verzögerung für CSS-Transition
	requestAnimationFrame(() => {
		overlayElement.classList.add("show");
	});
}

function hideOverlay(overlayElement, callback) {
	// Support für String (Element-ID) oder direktes Element
	if (typeof overlayElement === 'string') {
		overlayElement = document.getElementById(overlayElement);
	}
	
	overlayElement.classList.remove("show");
	// Warten bis Animation fertig ist
	setTimeout(() => {
		overlayElement.style.display = "none";
		if (callback) callback();
	}, 300); // entspricht der CSS transition Dauer
}

// ===== SCROLL-MANAGEMENT =====
function saveScrollPosition() {
	savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
}

function restoreScrollPosition() {
	window.scrollTo(0, savedScrollPosition);
}

function lockBodyScroll() {
	document.body.classList.add("overlay-open");
	document.body.style.top = `-${savedScrollPosition}px`;
}

function unlockBodyScroll() {
	document.body.classList.remove("overlay-open");
	document.body.style.top = "";
}

// ===== EXPORT =====
// Globale Verfügbarkeit sicherstellen
window.EditorCore = {
	renderTemplate,
	formatPreis,
	showOverlay,
	hideOverlay,
	saveScrollPosition,
	restoreScrollPosition,
	lockBodyScroll,
	unlockBodyScroll
};
