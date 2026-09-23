// ===== TAB VERWALTUNG =====
const EditorTabs = {
	currentTab: 'webseite',
	speisekarteLoaded: false,
	loadPromises: {},
	loadingCounts: {},
	webseitenLoaded: false,
	apartmentsLoaded: false,

	beginLoading(tabName) {
		const panel = document.getElementById(`${tabName}-tab`);
		this.loadingCounts[tabName] = (this.loadingCounts[tabName] || 0) + 1;
		panel.classList.add('is-loading');
		panel.setAttribute('aria-busy', 'true');
		panel.querySelector('.tab-loader').hidden = false;
		Array.from(panel.children).forEach(child => {
			if (!child.classList.contains('tab-loader')) child.inert = true;
		});
		return () => {
			if (--this.loadingCounts[tabName] > 0) return;
			panel.classList.remove('is-loading');
			panel.setAttribute('aria-busy', 'false');
			panel.querySelector('.tab-loader').hidden = true;
			Array.from(panel.children).forEach(child => {
				if (!child.classList.contains('tab-loader')) child.inert = false;
			});
		};
	},

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

		const loadedKey = tabName === 'webseite' ? 'webseitenLoaded' : `${tabName}Loaded`;
		if (this[loadedKey]) return;
		if (!this.loadPromises[tabName]) {
			this.loadPromises[tabName] = (async () => {
				const finishLoading = this.beginLoading(tabName);
				try {
					if (tabName === 'speisekarte') await this.loadSpeisekarte();
					else if (tabName === 'webseite') await WebseitenEditor.init();
					else if (tabName === 'apartments') await ApartmentsEditor.init();
					this[loadedKey] = true;
				} catch (error) {
					console.error(`Fehler beim Laden des Tabs ${tabName}:`, error);
				} finally {
					finishLoading();
				}
			})();
		}
		await this.loadPromises[tabName];
		delete this.loadPromises[tabName];
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

			// Globale Funktionen setzen
			window.render = EditorSPK.render;
			window.openImageOverlay = EditorImages.openImageOverlay;
			window.loadArchives = EditorTemplates.loadArchives;

			// Event-Listeners initialisieren
			EditorImages.initializeImageEventListeners();
			EditorTemplates.initializeTemplateEventListeners();

			this.speisekarteLoaded = true;
			console.log('✅ Speisekarte-Tab vollständig geladen');
		} catch (error) {
			throw error;
		}
	}
};

// Modul global verfügbar machen
window.EditorTabs = EditorTabs;

// Modul global verfügbar machen
window.EditorTabs = EditorTabs;
