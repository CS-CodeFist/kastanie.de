<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="de">

<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta http-equiv="X-UA-Compatible" content="ie=edge" />
	<title>Kastanie Molzow – Editor</title>
	<link rel="stylesheet" href="editor.css?20250402c" />
</head>

<body>
	<div id="loader">
		<div class="spinner"></div>
		<p>Lade Speisekarte…</p>
	</div>
	<h1>Speisekarten bearbeiten</h1>

	<div id="vorlagen-wrapper" style="margin-bottom: 1em; display: flex; justify-content:space-between;">
		<div>
			<label for="vorlagen">Speisekarte laden:</label>
			<select id="vorlagen">
				<option value="">– Auswahl –</option>
			</select>
		</div>
		<div>
			<label for="archivSelect">Archiv:</label>
			<select id="archivSelect" disabled>
				<option value="">– Archiv –</option>
			</select>
		</div>
	</div>

	<div id="editor"></div>

	<div id="buttonWrapper" class="option-button-group">
		<div style="display: flex; justify-content: space-between;">
			<button onclick="addMenu()">➕ Menü hinzufügen</button>
			<button id="optionsBtn">⚙️ Optionen</button>
		</div>
		<div style="display: flex; justify-content: space-between;">
			<button id="saveMenuBtn">💾 Menü speichern</button>
			<button id="logoutBtn">🚪 Logout</button>
		</div>
	</div>

	<!-- Overlay für Bildauswahl -->
	<div id="imageOverlay" class="image-overlay">
		<div id="imageOverlayContent" class="image-modal">
			<h2 style="margin: 0;">Bild auswählen</h2>

			<div id="imageLibraryGrid"></div>

			<div class="overlay-actions">
				<input type="file" id="imageUploadInput" accept="image/*" />

				<div class="overlay-button-row">
					<button id="refreshImageLibrary">🔄 Neu laden</button>
					<button id="toggleDeleteMode">🧹 Löschmodus</button>
				</div>

				<span id="uploadFeedback"></span>
			</div>

			<div class="overlay-footer">
				<button id="cancelImageOverlay">Abbrechen</button>
			</div>
		</div>
	</div>

	<!-- Overlay für Speichern -->
	<div id="saveOverlay" class="save-overlay">
		<div class="save-modal">
			<h2 style="margin: 0;">Speichern</h2>

			<label for="saveTargetSelect">Speichern als:</label>
			<select id="saveTargetSelect">
				<option value="data.json">Aktuelle Menükarte</option>
				<option disabled>──────────</option>
			</select>

			<div id="newTemplateNameWrapper" style="margin-top: 0.5em;">
				<label for="templateName">Neuer Vorlagenname:</label>
				<div style="display: flex; gap: 0.5em; align-items: center; margin-top: 0.3em;">
					<input type="text" id="templateName" placeholder="z. B. Frühlingskarte" />
					<button id="addTemplateBtn" style="margin-top: -5px; margin-right: 0px;">➕</button>
				</div>
			</div>

			<div class="overlay-footer">
				<button id="confirmSaveBtn">💾 Speichern</button>
				<button id="closeSaveOverlayBtn">Abbrechen</button>
			</div>
		</div>
	</div>

	<!-- Overlay Optionen -->
	<div id="optionsOverlay" class="overlay">
		<div class="overlay-content">
			<h2 style="margin: 0;">⚙️ Optionen</h2>
			<label for="layoutSelect">🌸 Saison-Layout</label>
			<select id="layoutSelect">
				<option disabled selected>Lade Layouts...</option>
			</select>
			<label>🌬️ Geschwindigkeit</label>
			<div id="geschwindigkeitButtons" class="option-button-group">
				<button data-value="1">🐢 langsam</button>
				<button data-value="2">⚖️ mittel</button>
				<button data-value="3">🏃‍♂️ schnell</button>
			</div>

			<label>🍃 Menge</label>
			<div id="mengeButtons" class="option-button-group">
				<button data-value="1">🌱 wenig</button>
				<button data-value="2">🌿 normal</button>
				<button data-value="3">🌳 viele</button>
			</div>
			<div class="overlay-footer">
				<button id="saveSeasonConfigBtn">💾 Speichern</button>
				<button id="closeOptionsOverlayBtn">Schließen</button>
			</div>
		</div>
	</div>

	<!-- TEMPLATE DEFINITIONS -->
	<script type="text/template" id="template-menu">
		<div class="menu">
			<div class="menu-header" style="display: flex; align-items: center;">
				<button type="button" class="drag-icon" style="margin-left: 0.5em; margin-right: 0; order: 2; align-self: center;">☰</button>
				<input type="text" value="{{menutitel}}" placeholder="Menütitel" data-field="menutitel" />
			</div>
			<div class="image-row">
				<div class="text-fields">
					<label>Titel<input type="text" value="{{titel}}" data-field="titel" /></label>
				</div>
				<img class="image-thumb {{#unless image}}placeholder{{/unless}}" {{#if image}}src="{{image}}"{{/if}} data-field="image" />
			</div>
			<div class="topbuttons">
				<button class="toggle-gerichte">{{gerichteToggleText}}</button>
				<button class="toggle-all-gerichte" {{#unless gerichteVisible}}style="display: none;"{{/unless}}>{{allToggleText}}</button>
			</div>
			<div class="gerichte-wrapper {{#unless gerichteVisible}}collapsed{{/unless}}">
				{{#each gerichte}}
					<div class="gericht {{#if _collapsed}}collapsed-gericht{{/if}}">
						<div class="gericht-header" style="display: flex; justify-content: space-between; align-items: center;">
							<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
								<input type="text" value="{{titel}}" placeholder="Gericht-Titel" data-field="titel" />
								<span class="drag-icon" style="margin-right: 0.5em; cursor: grab;">☰</span>
							</div>
						</div>
						<label>Beschreibung<textarea rows="3" data-field="beschreibung">{{beschreibung}}</textarea></label>
						<label>Zusatzstoffe (Komma)<input type="text" value="{{join zusatzstoffe ', '}}" data-field="zusatzstoffe" /></label>
						<label>Tag<input type="text" value="{{tag}}" data-field="tag" /></label>
						{{#each preisliste}}
							<div class="preis">
								<div class="preis-inner">
									<label>Größe<input type="text" class="size-input" value="{{size}}" data-field="size" /></label>
									<label>Preis<input type="number" class="preis-input" step="0.01" min="0" inputmode="decimal" value="{{preis}}" placeholder="z. B. 4.50" data-field="preis" /></label>
									<button type="button" class="delete-preis">🗑️</button>
								</div>
							</div>
						{{/each}}
						{{#if canAddPreis}}
							<button type="button" class="add-preis">➕ Preis hinzufügen</button>
						{{else}}
							<div style="color: gray;">⚠️ Maximal 3 Preise erlaubt</div>
						{{/if}}
						{{#each beilagen}}
							<div class="beilage">
								<div class="beilage-inner">
									<label>Beilage<input type="text" class="beilage-input" value="{{name}}" data-field="name" placeholder="z. B. Kartoffeln" /></label>
									<label>Preis<input type="number" class="beilage-preis-input" step="0.01" min="0" inputmode="decimal" value="{{preis}}" placeholder="z. B. 2.50" data-field="preis" /></label>
									<button type="button" class="delete-beilage">🗑️</button>
								</div>
							</div>
						{{/each}}
						{{#if canAddBeilage}}
							<button type="button" class="add-beilage">➕ Beilage hinzufügen</button>
						{{else}}
							<div style="color: gray;">⚠️ Maximal 4 Beilagen erlaubt</div>
						{{/if}}
						<button type="button" class="delete-gericht">🗑️ Gericht löschen</button>
					</div>
				{{/each}}
				<button type="button" class="add-gericht">➕ Gericht hinzufügen</button>
			</div>
			<div class="button-right">
				<button type="button" class="delete-menu">🗑️ Menü löschen</button>
			</div>
		</div>
	</script>

	<script type="text/template" id="template-image-grid-item">
		<div class="image-grid-item {{#if deleteMode}}delete-mode{{/if}}">
			<img src="{{src}}" class="image-thumb" />
			{{#if deleteMode}}
				<button type="button" class="delete-image">🗑️</button>
			{{/if}}
		</div>
	</script>

	<script type="text/template" id="template-template-option">
		<option value="{{value}}">{{text}}</option>
	</script>

	<script type="text/template" id="template-archive-option">
		<option value="{{value}}">{{formattedDate}}</option>
	</script>

	<!-- SCRIPTS -->
	<script src="https://cdn.jsdelivr.net/npm/handlebars@4.7.8/dist/handlebars.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
	<script src="editor_data.js"></script>
	<script src="editor.js?20250401"></script>
</body>

</html>