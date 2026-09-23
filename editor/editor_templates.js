// ===== EDITOR TEMPLATES - Template und Archiv-Management =====

let templateLoadRequest = 0;
let archiveListRequest = 0;

// ===== TEMPLATE-LADEN =====
// Lädt Templates und Archiv-Dropdown
async function loadTemplates(selectedTemplate = document.getElementById("vorlagen").value || "__current") {
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

	const finishLoading = EditorTabs.beginLoading('speisekarte');
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
	} finally {
		finishLoading();
	}

	// Templates hinzufügen
	templates.forEach(name => {
		const templateOption = EditorCore.renderTemplate("template-template-option", {
			value: name,
			text: name
		});
		select.insertAdjacentHTML('beforeend', templateOption);
	});

	select.value = templates.includes(selectedTemplate) ? selectedTemplate : "__current";
	select.onchange = async () => {
		const selected = select.value;
		if (!selected) return;
		await loadSelectedTemplate(selected);
	};

	archivSelect.onchange = async function() {
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

		const requestId = ++templateLoadRequest;
		const finishLoading = EditorTabs.beginLoading('speisekarte');
		try {
			const res = await fetch(`templates/archiv/${encodeURIComponent(file)}?t=${Date.now()}`);
			if (!res.ok) throw new Error("❌ Archiv konnte nicht geladen werden.");

			const json = await res.json();
			if (requestId !== templateLoadRequest) return;
			const selectedTemplate = document.getElementById("vorlagen").value;
			if (selectedTemplate && selectedTemplate !== "__current") json.filename = selectedTemplate + ".json";
			window.data = json;
			EditorSPK.markMenuDirty();

			if (typeof render === "function") {
				render(); // WICHTIG: sicherstellen, dass render() sichtbar ist
			} else {
				console.warn("⚠️ render() ist nicht definiert.");
			}
		} catch (err) {
			console.error("❌ Fehler beim Laden des Archiv-JSON:", err);
		} finally {
			finishLoading();
		}
	};

}

function templateSelectionForFilename(filename) {
	if (typeof filename !== "string" || !filename.endsWith(".json") || filename === "data.json") return "__current";
	const name = filename.slice(0, -5);
	const option = Array.from(document.getElementById("vorlagen").options).find(option =>
		!option.disabled && option.value !== "__current" && option.value.toLowerCase() === name.toLowerCase()
	);
	return option?.value || "__current";
}

async function loadSelectedTemplate(selected) {
	const finishLoading = EditorTabs.beginLoading('speisekarte');
	try {
	const requestId = ++templateLoadRequest;
	archiveListRequest++;
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

	const json = await res.json();
	if (requestId !== templateLoadRequest) return;
	if (!isCurrentMenu) json.filename = selected + ".json";
	window.data = json;
	const selectedTemplate = isCurrentMenu ? templateSelectionForFilename(json.filename) : selected;
	document.getElementById("vorlagen").value = selectedTemplate;
	if (isCurrentMenu) EditorSPK.markMenuSaved();
	else EditorSPK.markMenuDirty();
	render();
	await loadArchives(selectedTemplate === "__current" ? "data" : selectedTemplate);
	} finally {
		finishLoading();
	}
}

// Archivdateien für eine Vorlage laden
async function loadArchives(templateName, includeAll = false) {
	const requestId = ++archiveListRequest;
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

	const finishLoading = EditorTabs.beginLoading('speisekarte');
	try {
		const res = await fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: `action=list_archives&template=${encodeURIComponent(templateName)}&all=${includeAll ? "1" : "0"}`
		});

		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const response = await res.json();
		if (requestId !== archiveListRequest) return;
		const list = Array.isArray(response) ? response : response.archives;
		const hasMore = !Array.isArray(response) && response.hasMore;
		if (!Array.isArray(list) || list.length === 0) return;

		list.forEach(filename => {
			const match = filename.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})(?:_(\d+))?\.json$/);
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
	} finally {
		finishLoading();
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
	const selectedTemplate = document.getElementById("vorlagen").value;
	const selectedFilename = selectedTemplate === "__current" ? "data.json" : selectedTemplate + ".json";
	if (Array.from(select.options).some(option => option.value === selectedFilename)) select.value = selectedFilename;
	document.getElementById("templateName").value = "";
}

function closeSaveOverlay() {
	EditorCore.hideOverlay(document.getElementById("saveOverlay"));
}

// Save-Auswahl auswerten
async function confirmSaveJson() {
	const select = document.getElementById("saveTargetSelect");
	let filename = select.value;
	if (filename === "data.json") {
		const sourceTemplate = templateSelectionForFilename(window.data.filename);
		if (sourceTemplate !== "__current") filename = sourceTemplate + ".json";
	}
	const create = select.selectedOptions[0]?.dataset.newTemplate === "true";
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
				create,
				content: window.data
			})
		});

		const result = await response.json().catch(() => null);
		if (!response.ok || !result?.success) {
			throw new Error(result?.error || (response.ok ? "Ungültige Serverantwort" : `HTTP ${response.status}`));
		}

		const savedFilename = result.filename || filename;
		const savedTemplate = savedFilename === "data.json" ? "__current" : savedFilename.replace(/\.json$/, "");
		window.data = { ...window.data, filename: savedFilename };
		if (select.selectedOptions[0]) delete select.selectedOptions[0].dataset.newTemplate;
		EditorSPK.markMenuSaved();
		await loadTemplates(savedTemplate);
		await loadArchives(savedTemplate === "__current" ? "data" : savedTemplate);
		if (savedFilename === "data.json") {
			alert("✅ Aktueller Speiseplan wurde aktualisiert.");
		} else {
			const name = savedFilename.replace(/\.json$/, "");
			alert("✅ Vorlage \"" + name + "\" gespeichert und live geschaltet.");
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

		if (!/^[\p{L}\p{N}][\p{L}\p{N} _().-]*$/u.test(nameRaw) || nameRaw.endsWith('.') || new TextEncoder().encode(nameRaw + '.json').length > 160) {
			alert("Bitte einen Namen aus Buchstaben, Zahlen, Leerzeichen, Bindestrichen, Unterstrichen, Punkten oder Klammern verwenden, beginnend mit einem Buchstaben oder einer Zahl und ohne Punkt am Ende (maximal 155 UTF-8-Bytes).");
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

		const newOption = new Option(nameRaw, nameRaw + ".json");
		newOption.dataset.newTemplate = "true";
		select.add(newOption);
		select.value = newOption.value;

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
