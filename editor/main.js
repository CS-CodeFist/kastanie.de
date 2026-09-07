// ===== EDITOR MAIN - Modularer Einstiegspunkt =====
// Dieser File koordiniert alle Editor-Module

// ===== GLOBALE INITIALISIERUNG =====
window.onload = async function() {
	try {
		console.log("🚀 Editor wird initialisiert...");
		
		// Nur Tab-System initialisieren, Rest wird on-demand geladen
		EditorTabs.init();
		console.log("✅ Tab-System initialisiert");
		
		// Core Event-Listeners
		initializeCoreEventListeners();
		EditorImages.initializeImageEventListeners();
		
		// Loader verstecken
		document.getElementById("loader").style.display = "none";
		console.log("✅ Editor bereit");
		
	} catch (error) {
		console.error("❌ Fehler beim Initialisieren:", error);
		alert("Fehler beim Laden des Editors: " + error.message);
	}
};

// ===== EVENT-LISTENERS KOORDINATION =====
function initializeCoreEventListeners() {
	// Logout Button
	document.getElementById("logoutBtn")?.addEventListener("click", () => {
		if (confirm("Möchtest du dich wirklich ausloggen?")) {
			window.location.href = "logout.php";
		}
	});
}

// ===== GLOBALE FUNKTIONEN =====
// Diese Funktionen werden von anderen Modulen benötigt und müssen global verfügbar sein

// SPK-Funktionen global verfügbar machen (werden erst beim Tab-Laden gesetzt)
window.render = function() { console.log("SPK noch nicht geladen"); };
window.openImageOverlay = function() { console.log("Images noch nicht geladen"); };

// Template-Funktionen global verfügbar machen
window.renderTemplate = EditorCore.renderTemplate;
window.formatPreis = EditorCore.formatPreis;

// Overlay-Funktionen global verfügbar machen
window.showOverlay = EditorCore.showOverlay;
window.hideOverlay = EditorCore.hideOverlay;

// Scroll-Management global verfügbar machen
window.saveScrollPosition = EditorCore.saveScrollPosition;
window.restoreScrollPosition = EditorCore.restoreScrollPosition;
window.lockBodyScroll = EditorCore.lockBodyScroll;
window.unlockBodyScroll = EditorCore.unlockBodyScroll;

console.log("📄 Editor Main geladen - Tab-System wird beim window.onload initialisiert");// ===== EVENT-LISTENERS KOORDINATION =====
function initializeAllEventListeners() {
	// Core Event-Listeners
	initializeCoreEventListeners();
	
	// Modul-spezifische Event-Listeners
	EditorImages.initializeImageEventListeners();
	EditorTemplates.initializeTemplateEventListeners();
	EditorSeasons.initializeSeasonEventListeners();
}

function initializeCoreEventListeners() {
	// Logout Button
	document.getElementById("logoutBtn")?.addEventListener("click", () => {
		if (confirm("Möchtest du dich wirklich ausloggen?")) {
			window.location.href = "logout.php";
		}
	});
}

// ===== GLOBALE FUNKTIONEN =====
// Diese Funktionen werden von anderen Modulen benötigt und müssen global verfügbar sein

// SPK-Funktionen global verfügbar machen
window.render = EditorSPK.render;
// window.addMenu ist bereits in editor_spk.js definiert
window.openImageOverlay = EditorImages.openImageOverlay;

// Template-Funktionen global verfügbar machen
window.renderTemplate = EditorCore.renderTemplate;
window.formatPreis = EditorCore.formatPreis;

// Overlay-Funktionen global verfügbar machen
window.showOverlay = EditorCore.showOverlay;
window.hideOverlay = EditorCore.hideOverlay;

// Scroll-Management global verfügbar machen
window.saveScrollPosition = EditorCore.saveScrollPosition;
window.restoreScrollPosition = EditorCore.restoreScrollPosition;
window.lockBodyScroll = EditorCore.lockBodyScroll;
window.unlockBodyScroll = EditorCore.unlockBodyScroll;

// Image-Funktionen global verfügbar machen für SPK-Module
window.loadArchives = EditorTemplates.loadArchives;

// ===== DEBUG & DEVELOPMENT =====
// Development-Hilfsfunktionen (können später entfernt werden)
window.EditorDebug = {
	reloadModules: () => {
		console.log("🔄 Module werden neu geladen...");
		location.reload();
	},
	
	showModuleStatus: () => {
		console.log("📊 Modul-Status:");
		console.log("- Core:", typeof window.EditorCore !== 'undefined' ? "✅" : "❌");
		console.log("- SPK:", typeof window.EditorSPK !== 'undefined' ? "✅" : "❌");
		console.log("- Images:", typeof window.EditorImages !== 'undefined' ? "✅" : "❌");
		console.log("- Templates:", typeof window.EditorTemplates !== 'undefined' ? "✅" : "❌");
		console.log("- Seasons:", typeof window.EditorSeasons !== 'undefined' ? "✅" : "❌");
	},
	
	testRender: () => {
		if (window.data) {
			EditorSPK.render();
			console.log("✅ Test-Rendering erfolgreich");
		} else {
			console.log("❌ Keine Daten zum Rendern verfügbar");
		}
	}
};

console.log("📄 Editor Main geladen - Module werden beim window.onload initialisiert");
