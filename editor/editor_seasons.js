// ===== EDITOR SEASONS - Season-Layout Management =====

// ===== GLOBALE VARIABLEN =====
// (window._seasonLayouts wird automatisch von loadSeasonLayouts() gesetzt)

// ===== SEASON-LAYOUT-MANAGEMENT =====
async function loadSeasonLayouts() {
	try {
		const response = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: "action=load_layout_config"
		});
		
		const data = await response.json();
		
		if (!Array.isArray(data)) {
			console.error("Ungültiges Layout-Config-Format:", data);
			return;
		}

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
		updateSeasonButtons();
	} catch (err) {
		console.error("Fehler beim Laden der Saison-Layouts:", err);
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

	if (!layout) return;

	const geschwButtons = document.querySelectorAll("#geschwindigkeitButtons button");
	const mengeButtons = document.querySelectorAll("#mengeButtons button");

	geschwButtons.forEach(btn => {
		btn.classList.toggle("active", Number(btn.dataset.value) === Number(layout.geschwindigkeit));
	});

	mengeButtons.forEach(btn => {
		btn.classList.toggle("active", Number(btn.dataset.value) === Number(layout.menge));
	});
}

// ===== OPTIONS-OVERLAY-MANAGEMENT =====
function openOptionsOverlay() {
	// Scroll-Position speichern
	EditorCore.saveScrollPosition();
	EditorCore.lockBodyScroll();
	
	// Button-Event-Listener initialisieren
	initializeSeasonButtons();
	
	EditorCore.showOverlay(document.getElementById("optionsOverlay"));
}

function closeOptionsOverlay() {
	EditorCore.hideOverlay(document.getElementById("optionsOverlay"), () => {
		EditorCore.unlockBodyScroll();
		EditorCore.restoreScrollPosition();
	});
}

function saveSeasonConfig() {
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

	fetch("data_handler.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: "action=save_layout_config&data=" + encodeURIComponent(JSON.stringify(window._seasonLayouts))
	})
	.then(res => res.json())
	.then(result => {
		if (result.success) {
			alert("✅ Optionen gespeichert");
			document.getElementById("optionsOverlay").style.display = "none";
			EditorCore.unlockBodyScroll();
			EditorCore.restoreScrollPosition();
		} else {
			alert("Fehler beim Speichern: " + result.error);
		}
	});
}

// ===== EVENT-LISTENERS INITIALISIERUNG =====
function initializeSeasonEventListeners() {
	// Options Button
	document.querySelectorAll("#optionsBtn").forEach(button => {
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
