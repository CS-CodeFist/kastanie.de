// ===== EDITOR IMAGES - Bildmanagement =====

// ===== GLOBALE VARIABLEN =====
let currentImageTarget = null;
const cachedImageLibraries = {
	menu: null,
	webseite: null,
	apartments: null
};
let activeImageLibrary = "menu";
let deleteMode = false;
let imageEventListenersInitialized = false;

// ===== BILD-OVERLAY-MANAGEMENT =====
function openImageOverlay(onSelect, currentSrc, library = "menu", allowEmpty = false) {
	currentImageTarget = onSelect;
	activeImageLibrary = library;
	
	// Scroll-Position speichern
	EditorCore.saveScrollPosition();
	EditorCore.lockBodyScroll();

	const grid = document.getElementById("imageLibraryGrid");
	const refreshBtn = document.getElementById("refreshImageLibrary");
	const removeImageBtn = document.getElementById("removeImageSelection");
	refreshBtn.style.display = "inline-block";
	removeImageBtn.style.display = allowEmpty ? "inline-block" : "none";

	if (cachedImageLibraries[activeImageLibrary]) {
		renderImageGrid(cachedImageLibraries[activeImageLibrary]);
	} else {
		grid.innerHTML = "<p style='color:white'>Bilder werden geladen…</p>";
		loadImageLibrary(activeImageLibrary).then(images => {
			cachedImageLibraries[activeImageLibrary] = images;
			renderImageGrid(images);
		});
	}

	EditorCore.showOverlay(document.getElementById("imageOverlay"));
}

function closeImageOverlay() {
	EditorCore.hideOverlay(document.getElementById("imageOverlay"), () => {
		EditorCore.unlockBodyScroll();
		EditorCore.restoreScrollPosition();
		currentImageTarget = null;
	});
}

// ===== BILD-BIBLIOTHEK =====
function loadImageLibrary(library = activeImageLibrary) {
	return fetch("data_handler.php", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: "action=load_images&library=" + encodeURIComponent(library)
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

		const imageHTML = EditorCore.renderTemplate("template-image-grid-item", imageData);
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
							body: "action=archive_image&library=" + encodeURIComponent(activeImageLibrary) + "&filename=" + encodeURIComponent(img.name)
						})
						.then(res => res.json())
						.then(result => {
							if (result.success) {
								cachedImageLibraries[activeImageLibrary] = cachedImageLibraries[activeImageLibrary].filter(i => i.name !== img.name);
								renderImageGrid(cachedImageLibraries[activeImageLibrary]);
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

// ===== EVENT-LISTENERS INITIALISIERUNG =====
function initializeImageEventListeners() {
	if (imageEventListenersInitialized) return;
	imageEventListenersInitialized = true;

	// Cancel Button
	document.getElementById("cancelImageOverlay")?.addEventListener("click", closeImageOverlay);

	// Diese Option wird nur beim Aufruf aus dem Webseiteneditor eingeblendet.
	document.getElementById("removeImageSelection")?.addEventListener("click", () => {
		if (typeof currentImageTarget === "function") {
			currentImageTarget("");
			closeImageOverlay();
		}
	});

	// Refresh Button
	document.getElementById("refreshImageLibrary")?.addEventListener("click", function() {
		const grid = document.getElementById("imageLibraryGrid");
		grid.innerHTML = "<p style='color:white'>Bilder werden aktualisiert…</p>";
		loadImageLibrary(activeImageLibrary).then(images => {
			cachedImageLibraries[activeImageLibrary] = images;
			renderImageGrid(images);
		});
	});

	// Delete Mode Toggle
	document.getElementById("toggleDeleteMode")?.addEventListener("click", function() {
		deleteMode = !deleteMode;
		this.textContent = deleteMode ? "🚫 Löschen deaktivieren" : "🧹 Löschmodus";
		renderImageGrid(cachedImageLibraries[activeImageLibrary] || []);
	});

	// Image Upload
	document.getElementById("imageUploadInput")?.addEventListener("change", async function(e) {
		const file = e.target.files[0];
		if (!file) return;

		const feedbackBox = document.getElementById("uploadFeedback");
		const maxUploadSize = 32 * 1024 * 1024;
		const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		if (!supportedTypes.includes(file.type)) {
			feedbackBox.textContent = "❌ Bitte ein JPEG-, PNG-, GIF- oder WebP-Bild auswählen.";
			feedbackBox.style.color = "red";
			e.target.value = "";
			return;
		}

		if (file.size > maxUploadSize) {
			feedbackBox.textContent = "❌ Das Bild ist größer als 32 MB.";
			feedbackBox.style.color = "red";
			e.target.value = "";
			return;
		}

		feedbackBox.textContent = "⏳ Upload läuft...";
		feedbackBox.style.color = "#333";

		const formData = new FormData();
		formData.append("action", "upload_image");
		formData.append("library", activeImageLibrary);
		formData.append("image", file);

		try {
			const response = await fetch("data_handler.php", {
				method: "POST",
				body: formData
			});
			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.error || `HTTP ${response.status}`);
			}

			cachedImageLibraries[activeImageLibrary] = await loadImageLibrary(activeImageLibrary);
			renderImageGrid(cachedImageLibraries[activeImageLibrary]);
			feedbackBox.textContent = "✅ Bild erfolgreich hochgeladen.";
			feedbackBox.style.color = "green";
		} catch (error) {
			console.error("Bild-Upload fehlgeschlagen:", error);
			feedbackBox.textContent = "❌ Upload fehlgeschlagen: " + error.message;
			feedbackBox.style.color = "red";
		} finally {
			e.target.value = "";
		}
	});
}

// ===== EXPORT =====
// Globale Verfügbarkeit sicherstellen
window.EditorImages = {
	openImageOverlay,
	closeImageOverlay,
	loadImageLibrary,
	renderImageGrid,
	initializeImageEventListeners
};
