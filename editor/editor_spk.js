// ===== EDITOR SPK - Speisekarten-spezifische Funktionen =====

// ===== GLOBALE VARIABLEN =====
let data;
let menuSortable = null;
let menuHasUnsavedChanges = false;

function updateSaveMenuButton() {
	const saveButton = document.getElementById("saveMenuBtn");
	if (saveButton) saveButton.disabled = !menuHasUnsavedChanges;
}

function markMenuDirty() {
	menuHasUnsavedChanges = true;
	updateSaveMenuButton();
}

function markMenuSaved() {
	menuHasUnsavedChanges = false;
	updateSaveMenuButton();
}

window.addEventListener("beforeunload", event => {
	if (!menuHasUnsavedChanges) return;
	event.preventDefault();
	event.returnValue = "";
});

// ===== DATEN-MANAGEMENT =====
async function loadInitialData() {
	const res = await fetch(`speisekarte/data.json?t=${Date.now()}`);
	if (!res.ok) throw new Error("speisekarte/data.json konnte nicht geladen werden.");
	window.data = await res.json();
	markMenuSaved();
	document.getElementById("loader").style.display = "none";
}

// ===== MENÜ-MANAGEMENT =====
window.addMenu = function() {
	// Finde den Index des Infotext-Menüs
	const infotextIndex = window.data.content.findIndex(menu => 
		menu.menutitel && menu.menutitel.toLowerCase() === "infotext"
	);
	
	const newMenu = {
		menutitel: "",
		titel: "",
		image: "",
		gerichte: []
	};
	
	// Wenn Infotext gefunden wurde, füge das neue Menü davor ein
	if (infotextIndex !== -1) {
		window.data.content.splice(infotextIndex, 0, newMenu);
	} else {
		// Fallback: am Ende hinzufügen falls kein Infotext gefunden
		window.data.content.push(newMenu);
	}

	markMenuDirty();
	render();
};

function ensureInfotextExists() {
	// Prüfen, ob bereits ein infotext-Menü existiert
	const hasInfotext = window.data.content.some(menu => 
		menu.menutitel && menu.menutitel.toLowerCase() === "infotext"
	);
	
	// Falls nicht, erstelle eines am Ende
	if (!hasInfotext) {
		window.data.content.push({
			menutitel: "infotext",
			titel: "",
			image: "",
			gerichte: []
		});
	}
}

// ===== RENDERING =====
function render() {
	const editor = document.getElementById("editor");

	if (!editor.dataset.changeTracking) {
		editor.dataset.changeTracking = "true";
		editor.addEventListener("input", markMenuDirty);
	}

	// Scroll-Position vor dem Re-Rendering speichern
	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

	// Infotext-Menü erstellen falls nicht vorhanden
	ensureInfotextExists();

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
	// Nur für normale Menüs (nicht Logo/Infotext)
	const normalMenus = window.data.content.filter(menu => {
		const isInfotext = menu.menutitel && menu.menutitel.toLowerCase() === "infotext";
		const isLogo = menu.menutitel && menu.menutitel.toLowerCase() === "logo";
		return !isInfotext && !isLogo;
	});

	const sichtbarkeit = isInitial
		? normalMenus.map(() => false) // Initial alle eingeklappt
		: Array.from(document.querySelectorAll(".gerichte-wrapper")).map(div =>
			!div.classList.contains("collapsed")
		);

	// Editor komplett leeren
	editor.innerHTML = "";

	let normalMenuIndex = 0; // Separate Zählung für normale Menüs

	window.data.content.forEach((menu, menuIndex) => {
		// Spezielle Behandlung für infotext und logo
		const isInfotext = menu.menutitel && menu.menutitel.toLowerCase() === "infotext";
		const isLogo = menu.menutitel && menu.menutitel.toLowerCase() === "logo";
		
		// Für normale Menüs: aktueller Index im normalMenus Array
		const currentNormalIndex = (!isInfotext && !isLogo) ? normalMenuIndex++ : -1;
		
		// Template-Daten für das Menü vorbereiten
		const menuData = {
			menutitel: menu.menutitel || "",
			titel: menu.titel || "",
			image: menu.image || "",
			beschreibung: menu.beschreibung || "", // Begrüßungstext für Logo
			isInfotext: isInfotext,
			isLogo: isLogo,
			hasGerichte: (menu.gerichte || []).length > 0,
			gerichteVisible: (isInfotext || isLogo) ? false : (sichtbarkeit[currentNormalIndex] || false),
			gerichteToggleText: (currentNormalIndex >= 0 && sichtbarkeit[currentNormalIndex]) ? "🔽 Gerichte ausblenden" : "▶️ Gerichte anzeigen",
			allToggleText: menu.gerichte && menu.gerichte.every(g => g._collapsed) ? "▶️ Maximieren" : "🔽 Minimieren",
			gerichte: (isInfotext || isLogo) ? [] : (menu.gerichte || []).map(gericht => ({
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
		const menuHTML = EditorCore.renderTemplate("template-menu", menuData);
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = menuHTML;
		const menuElement = tempDiv.firstElementChild;

		// Event Listeners hinzufügen
		setupMenuEventListeners(menuElement, menu, menuIndex, currentNormalIndex, sichtbarkeit);

		editor.appendChild(menuElement);
	});

	// Menü-Sortable zuerst ggf. zerstören
	if (menuSortable) menuSortable.destroy();

	// Menü-Sortable neu erstellen
	menuSortable = Sortable.create(editor, {
		animation: 150,
		handle: ".menu-header .drag-icon",
		forceFallback: true,
		
		// Verhindere das Verschieben von Logo und Infotext
		filter: function(evt) {
			const menuIndex = Array.from(editor.children).indexOf(evt.item);
			const menu = window.data.content[menuIndex];
			const isLogo = menu && menu.menutitel && menu.menutitel.toLowerCase() === "logo";
			const isInfotext = menu && menu.menutitel && menu.menutitel.toLowerCase() === "infotext";
			return isLogo || isInfotext;
		},
		
		// Verhindere das Droppen vor Logo oder nach Infotext
		onMove: function(evt) {
			const fromIndex = evt.dragged.getBoundingClientRect();
			const toIndex = Array.from(editor.children).indexOf(evt.related);
			
			// Finde Logo und Infotext Positionen
			const logoIndex = window.data.content.findIndex(menu => 
				menu.menutitel && menu.menutitel.toLowerCase() === "logo"
			);
			const infotextIndex = window.data.content.findIndex(menu => 
				menu.menutitel && menu.menutitel.toLowerCase() === "infotext"
			);
			
			// Verhindere Droppen vor Logo (Position 0) oder nach Infotext (letzte Position)
			if (toIndex <= logoIndex || toIndex >= infotextIndex) {
				return false;
			}
			
			return true;
		},
		
		onEnd(evt) {
			const movedMenu = window.data.content.splice(evt.oldIndex, 1)[0];
			window.data.content.splice(evt.newIndex, 0, movedMenu);
			markMenuDirty();
			render();
		}
	});

	// Scroll-Position nach dem Re-Rendering wiederherstellen
	setTimeout(() => {
		window.scrollTo(0, scrollTop);
	}, 0);
}

// ===== EVENT LISTENERS =====
function setupMenuEventListeners(menuElement, menu, menuIndex, normalMenuIndex, sichtbarkeit) {
	// Spezielle Behandlung für infotext und logo
	const isInfotext = menu.menutitel && menu.menutitel.toLowerCase() === "infotext";
	const isLogo = menu.menutitel && menu.menutitel.toLowerCase() === "logo";
	
	// Input-Felder für Menü-Header
	const menutitelInput = menuElement.querySelector('input[data-field="menutitel"]');
	if (menutitelInput && !isInfotext && !isLogo) {
		menutitelInput.oninput = (e) => menu.menutitel = e.target.value;
	}

	const titelInput = menuElement.querySelector('input[data-field="titel"]');
	if (titelInput) {
		titelInput.oninput = (e) => menu.titel = e.target.value;
	}

	// Beschreibung für Logo (Begrüßungstext) und Infotext
	const beschreibungTextarea = menuElement.querySelector('textarea[data-field="beschreibung"]');
	if (beschreibungTextarea) {
		beschreibungTextarea.oninput = (e) => menu.beschreibung = e.target.value;
	}

	// Bild-Auswahl (für normale Menüs und infotext)
	const imageThumb = menuElement.querySelector('.image-thumb');
	if (imageThumb) {
		imageThumb.onclick = () => EditorImages.openImageOverlay((newSrc) => {
			menu.image = newSrc;
			markMenuDirty();
			render();
		}, menu.image);
	}

	// Toggle-Buttons (nur für normale Menüs)
	if (!isInfotext && !isLogo && normalMenuIndex >= 0) {
		const toggleBtn = menuElement.querySelector('.toggle-gerichte');
		const toggleAllBtn = menuElement.querySelector('.toggle-all-gerichte');
		const gerichteWrapper = menuElement.querySelector('.gerichte-wrapper');

		if (toggleBtn) {
			toggleBtn.onclick = () => {
				const openingGerichte = gerichteWrapper.classList.contains("collapsed");
				if (openingGerichte) {
					menu.gerichte.forEach(gericht => gericht._collapsed = false);
				}

				gerichteWrapper.classList.toggle("collapsed");
				sichtbarkeit[normalMenuIndex] = !gerichteWrapper.classList.contains("collapsed");
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

		// Gerichte-Sortable
		const gerichteWrapperForSortable = menuElement.querySelector('.gerichte-wrapper');
		if (gerichteWrapperForSortable) {
			Sortable.create(gerichteWrapperForSortable, {
				animation: 150,
				handle: ".gericht-header .drag-icon",
				onEnd: function(evt) {
					const moved = menu.gerichte.splice(evt.oldIndex, 1)[0];
					menu.gerichte.splice(evt.newIndex, 0, moved);
					markMenuDirty();
					render();
				}
			});
		}
	}

	// Menü löschen (nur für normale Menüs, nicht für infotext oder logo)
	if (!isInfotext && !isLogo) {
		const deleteMenuBtn = menuElement.querySelector('.delete-menu');
		if (deleteMenuBtn) {
			deleteMenuBtn.onclick = () => {
				if (confirm("❌ Möchtest du dieses Menü wirklich löschen?")) {
					window.data.content.splice(menuIndex, 1);
					markMenuDirty();
					render();
				}
			};
		}
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
				markMenuDirty();
				render();
			};
		}

		const deleteGerichtBtn = gerichtElement.querySelector('.delete-gericht');
		if (deleteGerichtBtn) {
			deleteGerichtBtn.onclick = () => {
				const confirmed = confirm("❌ Möchtest du dieses Gericht wirklich löschen?");
				if (confirmed) {
					menu.gerichte.splice(gerichtIndex, 1);
					markMenuDirty();
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
			markMenuDirty();
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
				markMenuDirty();
				render();
			};
		}
	});

	// Preis hinzufügen
	const addPreisBtn = gerichtElement.querySelector('.add-preis');
	if (addPreisBtn) {
		addPreisBtn.onclick = () => {
			gericht.preisliste.push({ size: "", preis: "" });
			markMenuDirty();
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
				markMenuDirty();
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
			markMenuDirty();
			render();
		};
	}
}

// ===== HILFSFUNKTIONEN =====
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
	thumb.onclick = () => EditorImages.openImageOverlay(onChange, imageData);
	return thumb;
}

// ===== EXPORT =====
// Globale Verfügbarkeit sicherstellen
window.EditorSPK = {
	loadInitialData,
	render,
	markMenuDirty,
	markMenuSaved,
	ensureInfotextExists,
	setupMenuEventListeners,
	setupGerichtEventListeners,
	setupPreisEventListeners,
	setupBeilagenEventListeners,
	createInput,
	createImageSelector
};
