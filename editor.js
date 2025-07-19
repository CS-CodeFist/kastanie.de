let data;
let currentImageTarget = null;
let cachedImageLibrary = null;
let deleteMode = false;
let collapseMap = new Map();

let menuSortable = null;

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

	// Vorlagen-Dropdown aufbauen
	select.innerHTML = '<option value="__current">Aktuelle Menükarte</option>';
	select.innerHTML += '<option disabled>─────────</option>';

	templates.forEach(name => {
		const opt = document.createElement("option");
		opt.value = name;
		opt.textContent = name;
		select.appendChild(opt);
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
			console.log(json)
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
	const currentOpt = document.createElement("option");
	currentOpt.value = "__current";
	currentOpt.textContent = "Aktueller Stand";
	archivSelect.appendChild(currentOpt);

	// Trennlinie
	const divider = document.createElement("option");
	divider.disabled = true;
	divider.textContent = "─────────";
	archivSelect.appendChild(divider);

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
			const opt = document.createElement("option");
			opt.value = filename;

			// Formatierter Name: data_2025-03-29_18-34-48.json → 29.03.2025 – 18:34
			const match = filename.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
			if (match) {
				const [, y, m, d, h, min] = match;
				opt.textContent = `${d}.${m}.${y} – ${h}:${min}`;
			} else {
				opt.textContent = filename.replace(".json", "");
			}

			archivSelect.appendChild(opt);
		});

		archivSelect.disabled = false;
	} catch (err) {
		console.error("❌ Fehler beim Laden des Archivs:", err);
	}
}

function formatArchivLabel(filename) {
	const match = filename.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.json$/);
	if (!match) return filename.replace(".json", "");

	const [, year, month, day, hour, min, sec] = match;
	return `${day}.${month}.${year} – ${hour}:${min}:${sec}`;
}

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

	const isInitial = !window.__renderedOnce;
	window.__renderedOnce = true;

	// Sichtbarkeit der Gerichte-Wrapper (collapsed = true → eingeklappt)
	const sichtbarkeit = isInitial
		? window.data.content.map(() => false) // Initial alle eingeklappt
		: Array.from(document.querySelectorAll(".gerichte-wrapper")).map(div =>
			!div.classList.contains("collapsed")
		);

	// Zustand der einzelnen Gerichte merken (für collapsed-gericht)
	const collapseMap = new Map();
	if (!isInitial) {
		document.querySelectorAll(".gerichte-wrapper").forEach((wrapper, mIndex) => {
			const gerichtStates = Array.from(wrapper.querySelectorAll(".gericht")).map(div =>
				div.classList.contains("collapsed-gericht")
			);
			collapseMap.set(mIndex, gerichtStates);
		});
	}

	editor.innerHTML = "";
	console.log("Rendering data:", window.data);

	window.data.content.forEach((menu, menuIndex) => {
		const menuDiv = document.createElement("div");
		menuDiv.className = "menu";

		const header = document.createElement("div");
		header.className = "menu-header";

		const dragIconM = document.createElement("button");
		dragIconM.textContent = "☰";
		dragIconM.type = "button";
		dragIconM.style.marginLeft = "0.5em";
		dragIconM.style.marginRight = "0";
		dragIconM.style.order = "2";
		dragIconM.style.alignSelf = "center";
		dragIconM.classList.add("drag-icon");

		header.style.display = "flex";
		header.style.alignItems = "center";
		header.appendChild(dragIconM);

		const menutitelInput = document.createElement("input");
		menutitelInput.type = "text";
		menutitelInput.value = menu.menutitel;
		menutitelInput.oninput = (e) => menu.menutitel = e.target.value;
		menutitelInput.placeholder = "Menütitel";
		header.appendChild(menutitelInput);

		menuDiv.appendChild(header);
		const imageRow = document.createElement("div");
		imageRow.className = "image-row";

		const textFields = document.createElement("div");
		textFields.className = "text-fields";
		textFields.appendChild(createInput("Titel", menu.titel || "", val => menu.titel = val));

		const imageThumb = createImageSelector(menu.image, (newSrc) => {
			menu.image = newSrc;
			render();
		});

		imageRow.appendChild(textFields);
		imageRow.appendChild(imageThumb);
		menuDiv.appendChild(imageRow);

		const gerichteWrapper = document.createElement("div");
		gerichteWrapper.className = "gerichte-wrapper";

		// Sichtbarkeit wiederherstellen oder initial einklappen
		if (!sichtbarkeit[menuIndex]) {
			gerichteWrapper.classList.add("collapsed");
		}
		const toggleWrapper = document.createElement("div");
		toggleWrapper.className = "topbuttons";
		
		const toggleBtn = document.createElement("button");
		const toggleAllBtn = document.createElement("button");
		
		function updateToggleLabel() {
			const isCollapsed = gerichteWrapper.classList.contains("collapsed");
			toggleBtn.textContent = isCollapsed ? "▶️ Gerichte anzeigen" : "🔽 Gerichte ausblenden";
		
			if (isCollapsed) {
				toggleAllBtn.style.display = "none";
			} else {
				toggleAllBtn.style.display = "inline-block";
				const allCollapsed = menu.gerichte.every(g => g._collapsed);
				toggleAllBtn.textContent = allCollapsed ? "▶️ Maximieren" : "🔽 Minimieren";
			}
		}
		toggleBtn.onclick = () => {
			gerichteWrapper.classList.toggle("collapsed");
			updateToggleLabel();
		};
		toggleAllBtn.onclick = () => {
			const allCollapsed = menu.gerichte.every(g => g._collapsed);
			menu.gerichte.forEach(g => g._collapsed = !allCollapsed);
			render();
		};
		
		updateToggleLabel();
		
		toggleWrapper.appendChild(toggleBtn);
		toggleWrapper.appendChild(toggleAllBtn);
		menuDiv.appendChild(toggleWrapper);

		menu.gerichte = menu.gerichte || [];
		menu.gerichte.forEach((gericht, gerichtIndex) => {
			const gerichtDiv = document.createElement("div");
			gerichtDiv.className = "gericht";
			if (gericht._collapsed) gerichtDiv.classList.add("collapsed-gericht");

			const gerichtHeader = document.createElement("div");
			gerichtHeader.className = "gericht-header";
			const dragIcon = document.createElement("span");
			dragIcon.textContent = "☰";
			dragIcon.style.marginRight = "0.5em";
			dragIcon.style.cursor = "grab";
			dragIcon.classList.add("drag-icon");
			gerichtHeader.style.display = "flex";
			gerichtHeader.style.justifyContent = "space-between";
			gerichtHeader.style.alignItems = "center";
			gerichtHeader.insertBefore(dragIcon, null);

			const gerichttitelInput = document.createElement("input");
			gerichttitelInput.type = "text";
			gerichttitelInput.value = gericht.titel;
			gerichttitelInput.oninput = (e) => gericht.titel = e.target.value;
			gerichttitelInput.placeholder = "Gericht-Titel";

			const gerichtHeaderWrapper = document.createElement("div");
			gerichtHeaderWrapper.style.display = "flex";
			gerichtHeaderWrapper.style.alignItems = "center";
			gerichtHeaderWrapper.style.justifyContent = "space-between";
			gerichtHeaderWrapper.style.width = "100%";
			gerichtHeaderWrapper.appendChild(gerichttitelInput);
			gerichtHeaderWrapper.appendChild(dragIcon);
			gerichtHeader.appendChild(gerichtHeaderWrapper);
			gerichtDiv.appendChild(gerichtHeader);

			gerichtDiv.appendChild(createInput("Beschreibung", gericht.beschreibung, val => gericht.beschreibung = val));
			gerichtDiv.appendChild(createInput("Zusatzstoffe (Komma)", gericht.zusatzstoffe?.join(", "), val => {
				gericht.zusatzstoffe = val.split(",").map(x => x.trim()).filter(Boolean);
			}));
			gerichtDiv.appendChild(createInput("Tag", gericht.tag || "", val => gericht.tag = val));

			gericht.preisliste = gericht.preisliste || [];
			gericht.preisliste.forEach((eintrag, preisIndex) => {
				const preisDiv = document.createElement("div");
				preisDiv.className = "preis";

				const innerDiv = document.createElement("div");
				innerDiv.className = "preis-inner";

				const sizeLabel = document.createElement("label");
				sizeLabel.textContent = "Größe";
				const sizeInput = document.createElement("input");
				sizeInput.type = "text";
				sizeInput.value = eintrag.size || "";
				sizeInput.oninput = (e) => eintrag.size = e.target.value;
				sizeInput.className = "size-input";
				sizeLabel.appendChild(sizeInput);
				innerDiv.appendChild(sizeLabel);

				const preisLabel = document.createElement("label");
				preisLabel.textContent = "Preis";
				const preisInput = document.createElement("input");
				preisInput.type = "number";
				preisInput.step = "0.01";
				preisInput.min = "0";
				preisInput.inputMode = "decimal";
				preisInput.value = eintrag.preis || "";
				preisInput.placeholder = "z. B. 4.50";
				preisInput.className = "preis-input";
				preisInput.oninput = (e) => {
					const val = e.target.value;
					eintrag.preis = /^\d+(\.\d{0,2})?$/.test(val) ? val : "";
				};
				preisLabel.appendChild(preisInput);
				innerDiv.appendChild(preisLabel);

				const delPreisBtn = document.createElement("button");
				delPreisBtn.textContent = "🗑️";
				delPreisBtn.onclick = () => {
					gericht.preisliste.splice(preisIndex, 1);
					render();
				};
				innerDiv.appendChild(delPreisBtn);

				preisDiv.appendChild(innerDiv);
				gerichtDiv.appendChild(preisDiv);
			});

			if (gericht.preisliste.length < 3) {
				const addPreisBtn = document.createElement("button");
				addPreisBtn.textContent = "➕ Preis hinzufügen";
				addPreisBtn.onclick = () => {
					gericht.preisliste.push({ size: "", preis: "" });
					render();
				};
				gerichtDiv.appendChild(addPreisBtn);
			} else {
				const limitHinweis = document.createElement("div");
				limitHinweis.textContent = "⚠️ Maximal 3 Preise erlaubt";
				limitHinweis.style.color = "gray";
				gerichtDiv.appendChild(limitHinweis);
			}

			const delGericht = document.createElement("button");
			delGericht.textContent = "🗑️ Gericht löschen";
			delGericht.onclick = () => {
				const confirmed = confirm("❌ Möchtest du dieses Gericht wirklich löschen?");
				if (confirmed) {
					menu.gerichte.splice(gerichtIndex, 1);
					render();
				}
			};
			gerichtDiv.appendChild(delGericht);

			gerichteWrapper.appendChild(gerichtDiv);
		});

		const addGerichtBtn = document.createElement("button");
		addGerichtBtn.textContent = "➕ Gericht hinzufügen";
		addGerichtBtn.onclick = () => {
			menu.gerichte.push({
				titel: "",
				beschreibung: "",
				zusatzstoffe: [],
				tag: "",
				preisliste: [],
				_collapsed: false
			});
			render();
		};
		gerichteWrapper.appendChild(addGerichtBtn);

		menuDiv.appendChild(gerichteWrapper);

		const delMenuWrapper = document.createElement("div");
		delMenuWrapper.className = "button-right";

		const delMenu = document.createElement("button");
		delMenu.textContent = "🗑️ Menü löschen";
		delMenu.onclick = () => {
			if (confirm("❌ Möchtest du dieses Menü wirklich löschen?")) {
				window.data.content.splice(menuIndex, 1);
				render();
			}
		};

		delMenuWrapper.appendChild(delMenu);
		menuDiv.appendChild(delMenuWrapper);

		editor.appendChild(menuDiv);

		Sortable.create(gerichteWrapper, {
			animation: 150,
			handle: ".gericht-header .drag-icon",
			onEnd: function(evt) {
				const moved = menu.gerichte.splice(evt.oldIndex, 1)[0];
				menu.gerichte.splice(evt.newIndex, 0, moved);
				render();
			}
		});
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

window.addMenu = function() {
	window.data.content.push({
		menutitel: "",
		titel: "",
		image: "",
		gerichte: []
	});
	render();
};

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
		const thumb = document.createElement("img");
		thumb.src = img.src;
		thumb.className = "image-thumb";

		const wrapper = document.createElement("div");
		wrapper.className = "image-wrapper";
		if (deleteMode) wrapper.classList.add("delete-mode");
		wrapper.appendChild(thumb);

		const delBtn = document.createElement("button");
		delBtn.textContent = "🗑️";
		delBtn.title = "Bild löschen";
		delBtn.className = "delete-button";
		delBtn.onclick = (ev) => {
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

		wrapper.appendChild(delBtn);
		wrapper.onclick = () => {
			if (typeof currentImageTarget === "function") {
				currentImageTarget(img.src);
				closeImageOverlay();
			}
		};

		grid.appendChild(wrapper);
	});
}

// Export & Speichern
function openSaveOverlay(existingTemplates = []) {
	document.body.classList.add("overlay-open");
	document.getElementById("saveOverlay").style.display = "flex";
	const select = document.getElementById("saveTargetSelect");

	select.innerHTML = '<option value="data.json">Aktuelle Menükarte</option><option disabled>─────────</option>';

	existingTemplates.forEach(name => {
		const opt = document.createElement("option");
		opt.value = name + ".json";
		opt.textContent = name;
		select.appendChild(opt);
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

	// Neue Option einfügen
	const newOption = document.createElement("option");
	newOption.value = fullValue;
	newOption.textContent = nameRaw;
	select.appendChild(newOption);
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