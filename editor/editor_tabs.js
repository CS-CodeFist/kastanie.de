// ===== TAB VERWALTUNG =====
const EditorTabs = {
	currentTab: 'webseite',
	speisekarteLoaded: false,
	speisekarteLoadPromise: null,
	webseitenLoaded: false,
	apartmentsLoaded: false,

	init() {
		this.setupTabNavigation();
		this.setActiveTab('webseite'); // Standard: Webseite aktiv
	},

	setupTabNavigation() {
		const tabButtons = document.querySelectorAll('.tab-button');
		
		tabButtons.forEach(button => {
			button.addEventListener('click', (e) => {
				const tabName = e.target.getAttribute('data-tab');
				this.setActiveTab(tabName);
			});
		});
	},

	async setActiveTab(tabName) {
		// Alle Tabs deaktivieren
		document.querySelectorAll('.tab-button').forEach(btn => {
			btn.classList.remove('active');
		});
		document.querySelectorAll('.tab-content').forEach(content => {
			content.classList.remove('active');
		});

		// Gewählten Tab aktivieren
		const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
		const activeContent = document.getElementById(`${tabName}-tab`);
		
		if (activeButton && activeContent) {
			activeButton.classList.add('active');
			activeContent.classList.add('active');
		}

		this.currentTab = tabName;

		// Tab-spezifische Initialisierung
		if (tabName === 'speisekarte' && !this.speisekarteLoaded) {
			if (!this.speisekarteLoadPromise) {
				this.speisekarteLoadPromise = this.loadSpeisekarte();
			}
			await this.speisekarteLoadPromise;
		} else if (tabName === 'webseite' && !this.webseitenLoaded) {
			console.log('Webseiten-Editor wird geladen...');
			try {
				// Webseiten-Editor initialisieren
				if (window.WebseitenEditor) {
					await WebseitenEditor.init();
					console.log('✅ Webseiten-Editor geladen');
				}
				
				this.webseitenLoaded = true;
			} catch (error) {
				console.error('❌ Fehler beim Laden des Webseiten-Editors:', error);
			}
		} else if (tabName === 'apartments' && !this.apartmentsLoaded) {
			try {
				if (window.ApartmentsEditor) {
					await ApartmentsEditor.init();
				}
				this.apartmentsLoaded = true;
			} catch (error) {
				console.error('❌ Fehler beim Laden des Apartments-Editors:', error);
			}
		}
	},

	async loadSpeisekarte() {
		console.log('Speisekarte wird geladen...');
		try {
			// Vorlagen-Select aufbauen und dessen Standardauswahl laden
			await EditorTemplates.loadTemplates();
			console.log("✅ Templates geladen");
			const templateSelect = document.getElementById("vorlagen");
			templateSelect.value = "__current";
			await EditorTemplates.loadSelectedTemplate(templateSelect.value);
			console.log("✅ Aktuelle Menükarte geladen");

			// Season-Layouts laden
			await EditorSeasons.loadSeasonLayouts();
			console.log("✅ Season-Layouts geladen");

			// Globale Funktionen setzen
			window.render = EditorSPK.render;
			window.openImageOverlay = EditorImages.openImageOverlay;
			window.loadArchives = EditorTemplates.loadArchives;

			// Event-Listeners initialisieren
			EditorImages.initializeImageEventListeners();
			EditorTemplates.initializeTemplateEventListeners();
			EditorSeasons.initializeSeasonEventListeners();

			this.speisekarteLoaded = true;
			console.log('✅ Speisekarte-Tab vollständig geladen');
		} catch (error) {
			this.speisekarteLoadPromise = null;
			console.error('❌ Fehler beim Laden der Speisekarte:', error);
		}
	}
};

// Modul global verfügbar machen
window.EditorTabs = EditorTabs;

// Modul global verfügbar machen
window.EditorTabs = EditorTabs;
