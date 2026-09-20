// ===== EDITOR SEASONS - Season-Layout Management =====

// ===== GLOBALE VARIABLEN =====
// (window._seasonLayouts wird automatisch von loadSeasonLayouts() gesetzt)

// ===== SEASON-LAYOUT-MANAGEMENT =====
let seasonPage = null;
let seasonLoadId = 0;
let seasonSaving = false;
let seasonListenersInitialized = false;

async function loadSeasonLayouts(page = EditorTabs.currentTab) {
	const loadId = ++seasonLoadId;
	const saveButton = document.getElementById('saveSeasonConfigBtn');
	saveButton.disabled = true;
	window._seasonLayouts = null;
	try {
		const response = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({ action: 'load_layout_config', page })
		});
		
		const data = await response.json();
		
		if (!response.ok || !Array.isArray(data)) {
			throw new Error(data.error || 'Ungültige Saison-Konfiguration');
		}
		if (loadId !== seasonLoadId) return;

		const select = document.getElementById("layoutSelect");
		select.innerHTML = "";

		// ❌ Saison nicht aktiv Option einfügen
		const noneOption = document.createElement("option");
		noneOption.value = "__none__";
		noneOption.textContent = "❌ Saison nicht aktiv";
		select.appendChild(noneOption);

		data.forEach(layout => {
			const option = document.createElement("option");
			option.value = layout.id;
			option.textContent = layout.label;
			if (layout.aktiv) {
				option.selected = true;
			}
			select.appendChild(option);
		});

		window._seasonLayouts = data;
		seasonPage = page;
		updateSeasonButtons();
		saveButton.disabled = false;
	} catch (err) {
		if (loadId === seasonLoadId) alert('Fehler beim Laden der Optionen: ' + err.message);
	}
}

// Event-Listener für Geschwindigkeits- und Menge-Buttons (nur einmal hinzufügen)
function initializeSeasonButtons() {
	// Geschwindigkeits-Buttons
	document.querySelectorAll("#geschwindigkeitButtons button").forEach(btn => {
		// Vorherige Event-Listener entfernen (falls vorhanden)
		btn.removeEventListener("click", btn._clickHandler);
		
		// Neuen Event-Listener erstellen und zuweisen
		btn._clickHandler = () => {
			document.querySelectorAll("#geschwindigkeitButtons button").forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
		};
		
		btn.addEventListener("click", btn._clickHandler);
	});

	// Menge-Buttons
	document.querySelectorAll("#mengeButtons button").forEach(btn => {
		// Vorherige Event-Listener entfernen (falls vorhanden)
		btn.removeEventListener("click", btn._clickHandler);
		
		// Neuen Event-Listener erstellen und zuweisen
		btn._clickHandler = () => {
			document.querySelectorAll("#mengeButtons button").forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
		};
		
		btn.addEventListener("click", btn._clickHandler);
	});
}

function updateSeasonButtons() {
	const selectedId = document.getElementById("layoutSelect").value;
	const layout = window._seasonLayouts?.find(l => l.id === selectedId);

	const geschwButtons = document.querySelectorAll("#geschwindigkeitButtons button");
	const mengeButtons = document.querySelectorAll("#mengeButtons button");

	geschwButtons.forEach(btn => {
		btn.classList.toggle("active", Number(btn.dataset.value) === Number(layout?.geschwindigkeit || 1));
	});

	mengeButtons.forEach(btn => {
		btn.classList.toggle("active", Number(btn.dataset.value) === Number(layout?.menge || 1));
	});
}

// ===== OPTIONS-OVERLAY-MANAGEMENT =====
function openOptionsOverlay() {
	if (seasonSaving) return;
	const page = EditorTabs.currentTab;
	const labels = { webseite: 'Webseite', speisekarte: 'Speisekarte', apartments: 'Apartments' };
	seasonPage = null;
	document.querySelector('#optionsOverlay h2').textContent = 'Optionen: ' + labels[page];
	document.getElementById('layoutSelect').replaceChildren(new Option('Lade Layouts...', '__none__'));
	// Scroll-Position speichern
	EditorCore.saveScrollPosition();
	EditorCore.lockBodyScroll();
	
	// Button-Event-Listener initialisieren
	initializeSeasonButtons();
	
	EditorCore.showOverlay(document.getElementById("optionsOverlay"));
	return loadSeasonLayouts(page);
}

function closeOptionsOverlay() {
	if (seasonSaving) return;
	seasonLoadId++;
	seasonPage = null;
	EditorCore.hideOverlay(document.getElementById("optionsOverlay"), () => {
		EditorCore.unlockBodyScroll();
		EditorCore.restoreScrollPosition();
	});
}

async function saveSeasonConfig() {
	if (seasonSaving || !seasonPage || !Array.isArray(window._seasonLayouts)) return;
	const page = seasonPage;
	const saveButton = document.getElementById('saveSeasonConfigBtn');
	const selectedId = document.getElementById("layoutSelect").value;
	const geschw = document.querySelector("#geschwindigkeitButtons .active")?.dataset.value || "1";
	const menge = document.querySelector("#mengeButtons .active")?.dataset.value || "1";

	// Alle Layouts durchgehen, aktiv setzen und Werte zuweisen
	window._seasonLayouts.forEach(layout => {
		layout.aktiv = (selectedId !== "__none__" && layout.id === selectedId);
		if (layout.aktiv) {
			layout.geschwindigkeit = geschw;
			layout.menge = menge;
		}
	});

	seasonSaving = true;
	saveButton.disabled = true;
	try {
		const response = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: new URLSearchParams({ action: 'save_layout_config', page, data: JSON.stringify(window._seasonLayouts) })
		});
		const result = await response.json();
		if (!response.ok || !result.success) throw new Error(result.error || 'Speichern fehlgeschlagen');
		alert('✅ Optionen gespeichert');
		seasonSaving = false;
		closeOptionsOverlay();
	} catch (error) {
		alert('Fehler beim Speichern: ' + error.message);
	} finally {
		seasonSaving = false;
		saveButton.disabled = false;
	}
}

// ===== EVENT-LISTENERS INITIALISIERUNG =====
function initializeSeasonEventListeners() {
	if (seasonListenersInitialized) return;
	seasonListenersInitialized = true;
	// Options Button
	document.querySelectorAll("#optionsBtn, #apartmentsOptionsBtn").forEach(button => {
		button.addEventListener("click", openOptionsOverlay);
	});
	
	// Close Options Button
	document.getElementById("closeOptionsOverlayBtn")?.addEventListener("click", closeOptionsOverlay);
	
	// Layout Select Change
	document.getElementById("layoutSelect")?.addEventListener("change", updateSeasonButtons);
	
	// Save Season Config Button
	document.getElementById("saveSeasonConfigBtn")?.addEventListener("click", saveSeasonConfig);
}

// ===== EXPORT =====
// Globale Verfügbarkeit sicherstellen
window.EditorSeasons = {
	loadSeasonLayouts,
	initializeSeasonButtons,
	updateSeasonButtons,
	openOptionsOverlay,
	closeOptionsOverlay,
	saveSeasonConfig,
	initializeSeasonEventListeners
};
