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

	<!-- SCRIPTS -->
	<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
	<script src="editor_data.js"></script>
	<script src="editor.js?20250401"></script>
</body>

</html>