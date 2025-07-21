let data;
let currentImageTarget = null;
let cachedImageLibrary = null;
let deleteMode = false;
let collapseMap = new Map();

let menuSortable = null;

// Template-Rendering-System mit Handlebars
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

// Handlebars Helper für Array-Join
Handlebars.registerHelper('join', function(array, separator) {
	if (!Array.isArray(array)) return '';
	return array.join(separator || ', ');
});

function formatPreis(value) {
	const number = parseFloat(value);
	if (isNaN(number)) return value;
	return number.toFixed(2).replace(".", ",");
}

window.onload = async function() {
	try {
		await loadTemplates();
		await loadInitialData();
		render();
	} catch (err) {
		console.error("❌ Fehler beim Initialisieren:", err);
	}
};

async function loadInitialData() {
	const res = await fetch(`data.json?t=${Date.now()}`);
	if (!res.ok) throw new Error("data.json konnte nicht geladen werden.");
	window.data = await res.json();

	// 🔁 Lade auch die Archiv-Versionen für data.json
	await loadArchives("data");
	document.getElementById("loader").style.display = "none";
}

// Lädt Templates und Archiv-Dropdown
async function loadTemplates() {
	const res = await fetch("data_handler.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: "action=list_templates"
	});
	const templates = await res.json();
	const select = document.getElementById("vorlagen");
	const archivSelect = document.getElementById("archivSelect");

	// Vorlagen-Dropdown mit Templates aufbauen
	select.innerHTML = '';
	
	// Aktuelle Menükarte
	const currentTemplate = renderTemplate("template-template-option", {
		value: "__current",
		text: "Aktuelle Menükarte"
	});
	select.insertAdjacentHTML('beforeend', currentTemplate);
	
	// Trennlinie
	const dividerTemplate = renderTemplate("template-template-option", {
		value: "",
		text: "─────────"
	});
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = dividerTemplate;
	const dividerOption = tempDiv.firstElementChild;
	dividerOption.disabled = true;
	select.appendChild(dividerOption);

	// Templates hinzufügen
	templates.forEach(name => {
		const templateOption = renderTemplate("template-template-option", {
			value: name,
			text: name
		});
		select.insertAdjacentHTML('beforeend', templateOption);
	});

	select.addEventListener("change", async () => {
		const selected = select.value;
		if (!selected) return;

		archivSelect.innerHTML = '<option value="">– Archiv –</option>';
		archivSelect.disabled = true;

		if (selected === "__current") {
			const res = await fetch("data.json?t=" + Date.now());
			window.data = await res.json();
			render();

			// Archivdaten von data.json laden
			await loadArchives("data");
		} else {
			const res = await fetch(`templates/${encodeURIComponent(selected)}.json?t=${Date.now()}`);
			if (!res.ok) return alert("❌ Vorlage konnte nicht geladen werden.");
			window.data = await res.json();
			render();

			// Archivdaten zur gewählten Vorlage laden
			await loadArchives(selected);
		}
	});

	archivSelect.addEventListener("change", async function() {
		const file = this.value;
		if (!file) return;

		if (file === "__current") {
			const res = await fetch("data.json?t=" + Date.now());
			window.data = await res.json();
			render();
			return;
		}

		try {
			const res = await fetch(`templates/archiv/${encodeURIComponent(file)}?t=${Date.now()}`);
			if (!res.ok) throw new Error("❌ Archiv konnte nicht geladen werden.");

			const json = await res.json();
			window.data = json;

			if (typeof render === "function") {
				render(); // WICHTIG: sicherstellen, dass render() sichtbar ist
			} else {
				console.warn("⚠️ render() ist nicht definiert.");
			}
		} catch (err) {
			console.error("❌ Fehler beim Laden des Archiv-JSON:", err);
		}
	});

	// Direkt nach dem Laden initiale Archivliste von data.json laden
	await loadArchives("data");
}

// Archivdateien für eine Vorlage laden
async function loadArchives(templateName) {
	const archivSelect = document.getElementById("archivSelect");
	archivSelect.innerHTML = "";

	// Aktuelles Menü als erste Option
	const currentArchive = renderTemplate("template-archive-option", {
		value: "__current",
		formattedDate: "Aktueller Stand"
	});
	archivSelect.insertAdjacentHTML('beforeend', currentArchive);

	// Trennlinie
	const dividerArchive = renderTemplate("template-archive-option", {
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
			body: `action=list_archives&template=${encodeURIComponent(templateName)}`
		});

		const list = await res.json();
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

			const archiveOption = renderTemplate("template-archive-option", {
				value: filename,
				formattedDate: formattedDate
			});
			archivSelect.insertAdjacentHTML('beforeend', archiveOption);
		});

		archivSelect.disabled = false;
	} catch (err) {
		console.error("❌ Fehler beim Laden des Archivs:", err);
	}
}

window.addMenu = function() {
	window.data.content.push({
		menutitel: "",
		titel: "",
		image: "",
		gerichte: []
	});
	render();
};

function createInput(labelText, value, onChange) {
	const label = document.createElement("label");
	label.textContent = labelText;

	if (labelText.toLowerCase().includes("beschreibung")) {
		const textarea = document.createElement("textarea");
		textarea.rows = 3;
		textarea.value = value || "";
		textarea.oninput = (e) => onChange(e.target.value);
		label.appendChild(textarea);
	} else {
		const input = document.createElement("input");
		input.value = value || "";
		input.oninput = (e) => onChange(e.target.value);
		label.appendChild(input);
	}

	return label;
}

function createImageSelector(imageData, onChange) {
	const thumb = document.createElement("img");
	thumb.className = "image-thumb";
	if (imageData) {
		thumb.src = imageData;
	} else {
		thumb.removeAttribute("src");
		thumb.classList.add("placeholder");
	}
	thumb.onclick = () => openImageOverlay(onChange, imageData);
	return thumb;
}

function render() {
	const editor = document.getElementById("editor");

	// Rückwärtskompatibilität: zusatzstoffetitel für bestehende Gerichte setzen
	window.data.content.forEach(menu => {
		if (menu.gerichte) {
			menu.gerichte.forEach(gericht => {
				if (!gericht.zusatzstoffetitel) {
					gericht.zusatzstoffetitel = "Inhaltsstoffe";
				}
			});
		}
	});

	const isInitial = !window.__renderedOnce;
	window.__renderedOnce = true;

	// Sichtbarkeit der Gerichte-Wrapper (collapsed = true → eingeklappt)
	const sichtbarkeit = isInitial
		? window.data.content.map(() => false) // Initial alle eingeklappt
		: Array.from(document.querySelectorAll(".gerichte-wrapper")).map(div =>
			!div.classList.contains("collapsed")
		);

	editor.innerHTML = "";

	window.data.content.forEach((menu, menuIndex) => {
		// Template-Daten für das Menü vorbereiten
		const menuData = {
			menutitel: menu.menutitel || "",
			titel: menu.titel || "",
			image: menu.image || "",
			gerichteVisible: sichtbarkeit[menuIndex] || false,
			gerichteToggleText: sichtbarkeit[menuIndex] ? "🔽 Gerichte ausblenden" : "▶️ Gerichte anzeigen",
			allToggleText: menu.gerichte && menu.gerichte.every(g => g._collapsed) ? "▶️ Maximieren" : "🔽 Minimieren",
			gerichte: (menu.gerichte || []).map(gericht => ({
				...gericht,
				zusatzstoffe: gericht.zusatzstoffe || [], // Direkt das Array verwenden, join wird im Template gemacht
				preisliste: gericht.preisliste || [],
				canAddPreis: (gericht.preisliste || []).length < 3,
				beilagen: gericht.beilagen || [],
				canAddBeilage: (gericht.beilagen || []).length < 4,
				_collapsed: gericht._collapsed || false
			}))
		};

		// Template rendern
		const menuHTML = renderTemplate("template-menu", menuData);
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = menuHTML;
		const menuElement = tempDiv.firstElementChild;

		// Event Listeners hinzufügen
		setupMenuEventListeners(menuElement, menu, menuIndex, sichtbarkeit);

		editor.appendChild(menuElement);
	});

	// Menü-Sortable zuerst ggf. zerstören
	if (menuSortable) menuSortable.destroy();

	// Menü-Sortable neu erstellen
	menuSortable = Sortable.create(editor, {
		animation: 150,
		handle: ".menu-header .drag-icon",
		forceFallback: true,
		onEnd(evt) {
			const movedMenu = window.data.content.splice(evt.oldIndex, 1)[0];
			window.data.content.splice(evt.newIndex, 0, movedMenu);
			render();
		}
	});
}

function setupMenuEventListeners(menuElement, menu, menuIndex, sichtbarkeit) {
	// Input-Felder für Menü-Header
	const menutitelInput = menuElement.querySelector('input[data-field="menutitel"]');
	if (menutitelInput) {
		menutitelInput.oninput = (e) => menu.menutitel = e.target.value;
	}

	const titelInput = menuElement.querySelector('input[data-field="titel"]');
	if (titelInput) {
		titelInput.oninput = (e) => menu.titel = e.target.value;
	}

	// Bild-Auswahl
	const imageThumb = menuElement.querySelector('.image-thumb');
	if (imageThumb) {
		imageThumb.onclick = () => openImageOverlay((newSrc) => {
			menu.image = newSrc;
			render();
		}, menu.image);
	}

	// Toggle-Buttons
	const toggleBtn = menuElement.querySelector('.toggle-gerichte');
	const toggleAllBtn = menuElement.querySelector('.toggle-all-gerichte');
	const gerichteWrapper = menuElement.querySelector('.gerichte-wrapper');

	if (toggleBtn) {
		toggleBtn.onclick = () => {
			gerichteWrapper.classList.toggle("collapsed");
			sichtbarkeit[menuIndex] = !gerichteWrapper.classList.contains("collapsed");
			render();
		};
	}

	if (toggleAllBtn) {
		toggleAllBtn.onclick = () => {
			const allCollapsed = menu.gerichte.every(g => g._collapsed);
			menu.gerichte.forEach(g => g._collapsed = !allCollapsed);
			render();
		};
	}

	// Gericht-Event-Listeners
	setupGerichtEventListeners(menuElement, menu);

	// Menü löschen
	const deleteMenuBtn = menuElement.querySelector('.delete-menu');
	if (deleteMenuBtn) {
		deleteMenuBtn.onclick = () => {
			if (confirm("❌ Möchtest du dieses Menü wirklich löschen?")) {
				window.data.content.splice(menuIndex, 1);
				render();
			}
		};
	}

	// Gerichte-Sortable
	const gerichteWrapperForSortable = menuElement.querySelector('.gerichte-wrapper');
	if (gerichteWrapperForSortable) {
		Sortable.create(gerichteWrapperForSortable, {
			animation: 150,
			handle: ".gericht-header .drag-icon",
			onEnd: function(evt) {
				const moved = menu.gerichte.splice(evt.oldIndex, 1)[0];
				menu.gerichte.splice(evt.newIndex, 0, moved);
				render();
			}
		});
	}
}

function setupGerichtEventListeners(menuElement, menu) {
	const gerichte = menuElement.querySelectorAll('.gericht');
	
	gerichte.forEach((gerichtElement, gerichtIndex) => {
		const gericht = menu.gerichte[gerichtIndex];
		
		// Gericht-Felder
		const titelInput = gerichtElement.querySelector('input[data-field="titel"]');
		if (titelInput) {
			titelInput.oninput = (e) => gericht.titel = e.target.value;
		}

		const beschreibungTextarea = gerichtElement.querySelector('textarea[data-field="beschreibung"]');
		if (beschreibungTextarea) {
			beschreibungTextarea.oninput = (e) => gericht.beschreibung = e.target.value;
		}

		const zusatzstoffeInput = gerichtElement.querySelector('input[data-field="zusatzstoffe"]');
		if (zusatzstoffeInput) {
			zusatzstoffeInput.oninput = (e) => {
				gericht.zusatzstoffe = e.target.value.split(",").map(x => x.trim()).filter(Boolean);
			};
		}

		const tagInput = gerichtElement.querySelector('input[data-field="tag"]');
		if (tagInput) {
			tagInput.oninput = (e) => gericht.tag = e.target.value;
		}

		const beilagentitelInput = gerichtElement.querySelector('input[data-field="beilagentitel"]');
		if (beilagentitelInput) {
			beilagentitelInput.oninput = (e) => gericht.beilagentitel = e.target.value;
		}

		const zusatzstoffetitelInput = gerichtElement.querySelector('input[data-field="zusatzstoffetitel"]');
		if (zusatzstoffetitelInput) {
			zusatzstoffetitelInput.oninput = (e) => gericht.zusatzstoffetitel = e.target.value;
		}

		// Preis-Event-Listeners
		setupPreisEventListeners(gerichtElement, gericht);

		// Beilagen-Event-Listeners
		setupBeilagenEventListeners(gerichtElement, gericht);

		// Gericht hinzufügen/löschen
		const addGerichtBtn = gerichtElement.querySelector('.add-gericht');
		if (addGerichtBtn) {
			addGerichtBtn.onclick = () => {
				gericht.preisliste.push({ size: "", preis: "" });
				render();
			};
		}

		const deleteGerichtBtn = gerichtElement.querySelector('.delete-gericht');
		if (deleteGerichtBtn) {
			deleteGerichtBtn.onclick = () => {
				const confirmed = confirm("❌ Möchtest du dieses Gericht wirklich löschen?");
				if (confirmed) {
					menu.gerichte.splice(gerichtIndex, 1);
					render();
				}
			};
		}
	});

	// Gericht hinzufügen (außerhalb der Gericht-Loop)
	const addGerichtBtn = menuElement.querySelector('.add-gericht');
	if (addGerichtBtn) {
		addGerichtBtn.onclick = () => {
			menu.gerichte = menu.gerichte || [];
			menu.gerichte.push({
				titel: "",
				beschreibung: "",
				zusatzstoffe: [],
				tag: "",
				beilagentitel: "",
				zusatzstoffetitel: "Inhaltsstoffe",
				preisliste: [],
				beilagen: [],
				_collapsed: false
			});
			render();
		};
	}
}

function setupPreisEventListeners(gerichtElement, gericht) {
	const preisElements = gerichtElement.querySelectorAll('.preis');
	
	preisElements.forEach((preisElement, preisIndex) => {
		const preisEintrag = gericht.preisliste[preisIndex];
		
		const sizeInput = preisElement.querySelector('input[data-field="size"]');
		if (sizeInput) {
			sizeInput.oninput = (e) => preisEintrag.size = e.target.value;
		}

		const preisInput = preisElement.querySelector('input[data-field="preis"]');
		if (preisInput) {
			preisInput.oninput = (e) => {
				const val = e.target.value;
				preisEintrag.preis = /^\d+(\.\d{0,2})?$/.test(val) ? val : "";
			};
		}

		const deletePreisBtn = preisElement.querySelector('.delete-preis');
		if (deletePreisBtn) {
			deletePreisBtn.onclick = () => {
				gericht.preisliste.splice(preisIndex, 1);
				render();
			};
		}
	});

	// Preis hinzufügen
	const addPreisBtn = gerichtElement.querySelector('.add-preis');
	if (addPreisBtn) {
		addPreisBtn.onclick = () => {
			gericht.preisliste.push({ size: "", preis: "" });
			render();
		};
	}
}

function setupBeilagenEventListeners(gerichtElement, gericht) {
	const beilagenElements = gerichtElement.querySelectorAll('.beilage');
	
	beilagenElements.forEach((beilageElement, beilageIndex) => {
		const beilageEintrag = gericht.beilagen[beilageIndex];
		
		const nameInput = beilageElement.querySelector('input[data-field="name"]');
		if (nameInput) {
			nameInput.oninput = (e) => beilageEintrag.name = e.target.value;
		}

		const preisInput = beilageElement.querySelector('input[data-field="preis"]');
		if (preisInput) {
			preisInput.oninput = (e) => {
				const val = e.target.value;
				beilageEintrag.preis = /^\d+(\.\d{0,2})?$/.test(val) ? val : "";
			};
		}

		const deleteBeilageBtn = beilageElement.querySelector('.delete-beilage');
		if (deleteBeilageBtn) {
			deleteBeilageBtn.onclick = () => {
				gericht.beilagen.splice(beilageIndex, 1);
				render();
			};
		}
	});

	// Beilage hinzufügen
	const addBeilageBtn = gerichtElement.querySelector('.add-beilage');
	if (addBeilageBtn) {
		addBeilageBtn.onclick = () => {
			if (!gericht.beilagen) {
				gericht.beilagen = [];
			}
			gericht.beilagen.push({ name: "", preis: "" });
			render();
		};
	}
}

function openImageOverlay(onSelect, currentSrc) {
	currentImageTarget = onSelect;
	document.body.classList.add("overlay-open");

	const grid = document.getElementById("imageLibraryGrid");
	const refreshBtn = document.getElementById("refreshImageLibrary");
	refreshBtn.style.display = "inline-block";

	if (cachedImageLibrary) {
		renderImageGrid(cachedImageLibrary);
	} else {
		grid.innerHTML = "<p style='color:white'>Bilder werden geladen…</p>";
		loadImageLibrary().then(images => {
			cachedImageLibrary = images;
			renderImageGrid(images);
		});
	}

	document.getElementById("imageOverlay").style.display = "flex";
}

function closeImageOverlay() {
	document.body.classList.remove("overlay-open");
	document.getElementById("imageOverlay").style.display = "none";
	currentImageTarget = null;
}

document.getElementById("cancelImageOverlay")?.addEventListener("click", closeImageOverlay);

document.getElementById("refreshImageLibrary")?.addEventListener("click", function() {
	const grid = document.getElementById("imageLibraryGrid");
	grid.innerHTML = "<p style='color:white'>Bilder werden aktualisiert…</p>";
	loadImageLibrary().then(images => {
		cachedImageLibrary = images;
		renderImageGrid(images);
	});
});

document.getElementById("toggleDeleteMode")?.addEventListener("click", function() {
	deleteMode = !deleteMode;
	this.textContent = deleteMode ? "🚫 Löschen deaktivieren" : "🧹 Löschmodus";
	renderImageGrid(cachedImageLibrary || []);
});

document.getElementById("imageUploadInput")?.addEventListener("change", function(e) {
	const file = e.target.files[0];
	if (!file) return;

	const feedbackBox = document.getElementById("uploadFeedback");
	feedbackBox.textContent = "⏳ Upload läuft...";
	feedbackBox.style.color = "#333";

	const formData = new FormData();
	formData.append("action", "upload_image");
	formData.append("image", file);

	fetch("data_handler.php", {
			method: "POST",
			body: formData
		})
		.then(res => res.json())
		.then(response => {
			if (response.success && typeof currentImageTarget === "function") {
				cachedImageLibrary = null;
				loadImageLibrary().then(images => {
					cachedImageLibrary = images;
					renderImageGrid(images);
					feedbackBox.textContent = "✅ Bild erfolgreich hochgeladen.";
					feedbackBox.style.color = "green";
				});
			} else {
				feedbackBox.textContent = "❌ Fehler beim Hochladen des Bildes.";
				feedbackBox.style.color = "red";
			}
		});
});

function loadImageLibrary() {
	return fetch("data_handler.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: "action=load_images"
	}).then(res => res.json());
}

function renderImageGrid(images) {
	const grid = document.getElementById("imageLibraryGrid");
	grid.innerHTML = "";

	images.forEach(img => {
		const imageData = {
			src: img.src,
			deleteMode: deleteMode
		};

		const imageHTML = renderTemplate("template-image-grid-item", imageData);
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = imageHTML;
		const wrapper = tempDiv.firstElementChild;

		// Event Listeners hinzufügen
		const thumb = wrapper.querySelector('.image-thumb');
		if (thumb) {
			thumb.onclick = () => {
				if (typeof currentImageTarget === "function") {
					currentImageTarget(img.src);
					closeImageOverlay();
				}
			};
		}

		const deleteBtn = wrapper.querySelector('.delete-image');
		if (deleteBtn) {
			deleteBtn.onclick = (ev) => {
				ev.stopPropagation();
				if (confirm("Möchtest du das Bild wirklich löschen?")) {
					fetch("data_handler.php", {
							method: "POST",
							headers: {
								"Content-Type": "application/x-www-form-urlencoded"
							},
							body: "action=archive_image&filename=" + encodeURIComponent(img.name)
						})
						.then(res => res.json())
						.then(result => {
							if (result.success) {
								cachedImageLibrary = cachedImageLibrary.filter(i => i.name !== img.name);
								renderImageGrid(cachedImageLibrary);
							} else {
								alert("Fehler beim Löschen: " + (result.error || "Unbekannter Fehler"));
							}
						});
				}
			};
		}

		grid.appendChild(wrapper);
	});
}

// Export & Speichern
function openSaveOverlay(existingTemplates = []) {
	document.body.classList.add("overlay-open");
	document.getElementById("saveOverlay").style.display = "flex";
	const select = document.getElementById("saveTargetSelect");

	// Aktuelle Menükarte
	const currentOption = renderTemplate("template-template-option", {
		value: "data.json",
		text: "Aktuelle Menükarte"
	});
	select.innerHTML = currentOption;

	// Trennlinie
	const dividerOption = renderTemplate("template-template-option", {
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
		const templateOption = renderTemplate("template-template-option", {
			value: name + ".json",
			text: name
		});
		select.insertAdjacentHTML('beforeend', templateOption);
	});

	// Auswahl zurücksetzen
	document.getElementById("templateName").value = "";
}

function closeSaveOverlay() {
	document.getElementById("saveOverlay").style.display = "none";
	document.body.classList.remove("overlay-open");
}

document.querySelectorAll("input[name='saveTarget']").forEach(r => {
	r.addEventListener("change", () => {
		const templateMode = document.querySelector("input[name='saveTarget']:checked").value === "template";
		document.getElementById("templateOptions").style.display = templateMode ? "block" : "none";
	});
});

document.getElementById("saveMenuBtn")?.addEventListener("click", async function() {
	const res = await fetch("data_handler.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: "action=list_templates"
	});
	const list = await res.json();
	openSaveOverlay(Array.isArray(list) ? list : []);
});

document.getElementById("confirmSaveBtn")?.addEventListener("click", confirmSaveJson);
document.getElementById("closeSaveOverlayBtn")?.addEventListener("click", closeSaveOverlay);


// Neues Template zur Liste hinzufügen
document.getElementById("addTemplateBtn").addEventListener("click", function() {
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
	const newOptionHTML = renderTemplate("template-template-option", {
		value: fullValue,
		text: nameRaw
	});
	select.insertAdjacentHTML('beforeend', newOptionHTML);
	select.value = fullValue;

	input.value = "";
});


// Save-Auswahl auswerten
function confirmSaveJson() {
	const select = document.getElementById("saveTargetSelect");
	const filename = select.value;

	if (!filename) {
		alert("Bitte wähle ein Ziel zum Speichern.");
		return;
	}

	fetch("data_handler.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				action: "save_file",
				filename,
				content: window.data
			})
		})
		.then(res => res.json())
		.then(response => {
			if (response.success) {
				if (filename === "data.json") {
					alert("✅ Aktueller Speiseplan wurde aktualisiert.");
				} else {
					const name = filename.replace(/\.json$/, "");
					alert("✅ Vorlage gespeichert als „" + name + "“");
				}
				closeSaveOverlay();
			} else {
				alert("Fehler beim Speichern: " + response.error);
			}
		});
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
	if (confirm("Möchtest du dich wirklich ausloggen?")) {
		window.location.href = "logout.php";
	}
});

document.getElementById("optionsBtn")?.addEventListener("click", function () {
	document.body.classList.add("overlay-open");
    document.getElementById("optionsOverlay").style.display = "flex";
	loadSeasonLayouts();
});

document.getElementById("closeOptionsOverlayBtn")?.addEventListener("click", function () {
    document.getElementById("optionsOverlay").style.display = "none";
	document.body.classList.remove("overlay-open");
});

function loadSeasonLayouts() {
	fetch("data_handler.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: "action=load_layout_config"
	})
	.then(response => response.json())
	.then(data => {
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
	})
	.catch(err => {
		console.error("Fehler beim Laden der Saison-Layouts:", err);
	});
}

document.querySelectorAll("#geschwindigkeitButtons button").forEach(btn => {
	btn.addEventListener("click", () => {
		document.querySelectorAll("#geschwindigkeitButtons button").forEach(b => b.classList.remove("active"));
		btn.classList.add("active");
	});
});

document.querySelectorAll("#mengeButtons button").forEach(btn => {
	btn.addEventListener("click", () => {
		document.querySelectorAll("#mengeButtons button").forEach(b => b.classList.remove("active"));
		btn.classList.add("active");
	});
});

document.getElementById("layoutSelect").addEventListener("change", () => {
	updateSeasonButtons();
});

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

document.getElementById("saveSeasonConfigBtn").addEventListener("click", () => {
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
			document.body.classList.remove("overlay-open");
		} else {
			alert("Fehler beim Speichern: " + result.error);
		}
	});
});