// ===== EDITOR TEMPLATES - Template und Archiv-Management =====

// ===== TEMPLATE-LADEN =====
// Lädt Templates und Archiv-Dropdown
async function loadTemplates() {
	const select = document.getElementById("vorlagen");
	const archivSelect = document.getElementById("archivSelect");
	let templates = [];

	// Vorlagen-Dropdown mit Templates aufbauen
	select.innerHTML = '';
	
	// Aktuelle Menükarte
	const currentTemplate = EditorCore.renderTemplate("template-template-option", {
		value: "__current",
		text: "Aktuelle Menükarte"
	});
	select.insertAdjacentHTML('beforeend', currentTemplate);
	
	// Trennlinie
	const dividerTemplate = EditorCore.renderTemplate("template-template-option", {
		value: "",
		text: "─────────"
	});
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = dividerTemplate;
	const dividerOption = tempDiv.firstElementChild;
	dividerOption.disabled = true;
	select.appendChild(dividerOption);

	try {
		const res = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: "action=list_templates"
		});

		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		templates = await res.json();
		if (!Array.isArray(templates)) throw new Error("Ungültige Vorlagenliste");
	} catch (error) {
		console.error("Vorlagen konnten nicht geladen werden:", error);
	}

	// Templates hinzufügen
	templates.forEach(name => {
		const templateOption = EditorCore.renderTemplate("template-template-option", {
			value: name,
			text: name
		});
		select.insertAdjacentHTML('beforeend', templateOption);
	});

	select.addEventListener("change", async () => {
		const selected = select.value;
		if (!selected) return;
		await loadSelectedTemplate(selected);
	});

	archivSelect.addEventListener("change", async function() {
		const file = this.value;
		if (!file) return;

		if (file === "__load_all__") {
			const selectedTemplate = document.getElementById("vorlagen").value;
			await loadArchives(selectedTemplate === "__current" ? "data" : selectedTemplate, true);
			return;
		}

		if (file === "__current") {
			await loadSelectedTemplate(document.getElementById("vorlagen").value);
			return;
		}

		try {
			const res = await fetch(`templates/archiv/${encodeURIComponent(file)}?t=${Date.now()}`);
			if (!res.ok) throw new Error("❌ Archiv konnte nicht geladen werden.");

			const json = await res.json();
			window.data = json;
			EditorSPK.markMenuSaved();

			if (typeof render === "function") {
				render(); // WICHTIG: sicherstellen, dass render() sichtbar ist
			} else {
				console.warn("⚠️ render() ist nicht definiert.");
			}
		} catch (err) {
			console.error("❌ Fehler beim Laden des Archiv-JSON:", err);
		}
	});

}

async function loadSelectedTemplate(selected) {
	const archivSelect = document.getElementById("archivSelect");
	archivSelect.innerHTML = '<option value="">– Archiv –</option>';
	archivSelect.disabled = true;

	const isCurrentMenu = selected === "__current";
	const url = isCurrentMenu
		? "speisekarte/data.json?t=" + Date.now()
		: `templates/${encodeURIComponent(selected)}.json?t=${Date.now()}`;
	const res = await fetch(url);

	if (!res.ok) {
		throw new Error(isCurrentMenu ? "Aktuelle Menükarte konnte nicht geladen werden." : "Vorlage konnte nicht geladen werden.");
	}

	window.data = await res.json();
	EditorSPK.markMenuSaved();
	render();
	await loadArchives(isCurrentMenu ? "data" : selected);
}

// Archivdateien für eine Vorlage laden
async function loadArchives(templateName, includeAll = false) {
	const archivSelect = document.getElementById("archivSelect");
	archivSelect.innerHTML = "";

	// Aktuelles Menü als erste Option
	const currentArchive = EditorCore.renderTemplate("template-archive-option", {
		value: "__current",
		formattedDate: "Aktueller Stand"
	});
	archivSelect.insertAdjacentHTML('beforeend', currentArchive);

	// Trennlinie
	const dividerArchive = EditorCore.renderTemplate("template-archive-option", {
		value: "",
		formattedDate: "─────────"
	});
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = dividerArchive;
	const dividerOption = tempDiv.firstElementChild;
	dividerOption.disabled = true;
	archivSelect.appendChild(dividerOption);

	archivSelect.disabled = true;

	try {
		const res = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: `action=list_archives&template=${encodeURIComponent(templateName)}&all=${includeAll ? "1" : "0"}`
		});

		const response = await res.json();
		const list = Array.isArray(response) ? response : response.archives;
		const hasMore = !Array.isArray(response) && response.hasMore;
		if (!Array.isArray(list) || list.length === 0) return;

		list.forEach(filename => {
			const match = filename.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
			let formattedDate;
			if (match) {
				const [, y, m, d, h, min] = match;
				formattedDate = `${d}.${m}.${y} – ${h}:${min}`;
			} else {
				formattedDate = filename.replace(".json", "");
			}

			const archiveOption = EditorCore.renderTemplate("template-archive-option", {
				value: filename,
				formattedDate: formattedDate
			});
			archivSelect.insertAdjacentHTML('beforeend', archiveOption);
		});

		if (hasMore) {
			const loadAllOption = EditorCore.renderTemplate("template-archive-option", {
				value: "__load_all__",
				formattedDate: "Weitere Archive laden"
			});
			archivSelect.insertAdjacentHTML('beforeend', loadAllOption);
		}

		archivSelect.disabled = false;
	} catch (err) {
		console.error("❌ Fehler beim Laden des Archivs:", err);
	}
}

// ===== SPEICHERN & EXPORT =====
// Export & Speichern
function openSaveOverlay(existingTemplates = []) {
	EditorCore.showOverlay(document.getElementById("saveOverlay"));
	const select = document.getElementById("saveTargetSelect");

	// Aktuelle Menükarte
	const currentOption = EditorCore.renderTemplate("template-template-option", {
		value: "data.json",
		text: "Aktuelle Menükarte"
	});
	select.innerHTML = currentOption;

	// Trennlinie
	const dividerOption = EditorCore.renderTemplate("template-template-option", {
		value: "",
		text: "─────────"
	});
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = dividerOption;
	const divider = tempDiv.firstElementChild;
	divider.disabled = true;
	select.appendChild(divider);

	// Templates hinzufügen
	existingTemplates.forEach(name => {
		const templateOption = EditorCore.renderTemplate("template-template-option", {
			value: name + ".json",
			text: name
		});
		select.insertAdjacentHTML('beforeend', templateOption);
	});

	// Auswahl zurücksetzen
	document.getElementById("templateName").value = "";
}

function closeSaveOverlay() {
	EditorCore.hideOverlay(document.getElementById("saveOverlay"));
}

// Save-Auswahl auswerten
async function confirmSaveJson() {
	const select = document.getElementById("saveTargetSelect");
	const filename = select.value;
	const saveButton = document.getElementById("confirmSaveBtn");

	if (!filename) {
		alert("Bitte wähle ein Ziel zum Speichern.");
		return;
	}

	saveButton.disabled = true;
	saveButton.textContent = "Wird gespeichert...";

	try {
		const response = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				action: "save_file",
				filename,
				content: window.data
			})
		});

		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const result = await response.json();
		if (!result.success) throw new Error(result.error || "Unbekannter Fehler");

		EditorSPK.markMenuSaved();
		if (filename === "data.json") {
			alert("✅ Aktueller Speiseplan wurde aktualisiert.");
		} else {
			const name = filename.replace(/\.json$/, "");
			alert("✅ Vorlage gespeichert als \"" + name + "\"");
		}
		closeSaveOverlay();
	} catch (error) {
		console.error("Speichern fehlgeschlagen:", error);
		alert("Fehler beim Speichern: " + error.message);
	} finally {
		saveButton.disabled = false;
		saveButton.textContent = "💾 Speichern";
	}
}

// ===== EVENT-LISTENERS INITIALISIERUNG =====
function initializeTemplateEventListeners() {
	// Save Target Radio Buttons
	document.querySelectorAll("input[name='saveTarget']").forEach(r => {
		r.addEventListener("change", () => {
			const templateMode = document.querySelector("input[name='saveTarget']:checked").value === "template";
			document.getElementById("templateOptions").style.display = templateMode ? "block" : "none";
		});
	});

	// Save Menu Button
	document.getElementById("saveMenuBtn")?.addEventListener("click", async function() {
		try {
			const res = await fetch("data_handler.php", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: "action=list_templates"
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const list = await res.json();
			if (!Array.isArray(list)) throw new Error("Ungültige Vorlagenliste");
			openSaveOverlay(list);
		} catch (error) {
			console.error("Vorlagen für Speichern konnten nicht geladen werden:", error);
			openSaveOverlay([]);
		}
	});

	// Save Buttons
	document.getElementById("confirmSaveBtn")?.addEventListener("click", confirmSaveJson);
	document.getElementById("closeSaveOverlayBtn")?.addEventListener("click", closeSaveOverlay);

	// Add Template Button
	document.getElementById("addTemplateBtn")?.addEventListener("click", function() {
		const input = document.getElementById("templateName");
		const nameRaw = input.value.trim();
		const select = document.getElementById("saveTargetSelect");

		if (!nameRaw) {
			alert("Bitte gib einen Vorlagennamen ein.");
			return;
		}

		const nameLower = nameRaw.toLowerCase();
		const fullValue = nameLower + ".json";

		// Prüfen, ob der Name schon existiert
		for (let i = 0; i < select.options.length; i++) {
			if (select.options[i].value.toLowerCase() === fullValue) {
				alert("Eine Vorlage mit diesem Namen existiert bereits.");
				return;
			}
		}

		// Neue Option mit Template einfügen
		const newOptionHTML = EditorCore.renderTemplate("template-template-option", {
			value: fullValue,
			text: nameRaw
		});
		select.insertAdjacentHTML('beforeend', newOptionHTML);
		select.value = fullValue;

		input.value = "";
	});
}

// ===== EXPORT =====
// Globale Verfügbarkeit sicherstellen
window.EditorTemplates = {
	loadTemplates,
	loadSelectedTemplate,
	loadArchives,
	openSaveOverlay,
	closeSaveOverlay,
	confirmSaveJson,
	initializeTemplateEventListeners
};
