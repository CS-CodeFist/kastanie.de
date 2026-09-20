<?php
$pageTitle = 'Apartments | Kastanie Moltzow';
$pageDescription = 'Entdecken Sie die Apartments der Kastanie in Moltzow. Bilder, Informationen zu den Unterkünften und Kontakt für Ihre Anfrage.';
$pagePath = '/apartments';
$baseHref = '../';
$contentSource = 'apartments/data.json';
$hasSectionNavigation = true;
$navigationLabel = 'Apartments-Navigation';
$seasonPage = 'apartments';
require __DIR__ . '/partials/header.php';
?>
    <main id="content" aria-live="polite">
        <div class="loading" role="status">Inhalte werden geladen ...</div>
    </main>

    <script src="webseite/opening-hours.js?v=20260920-rest-day"></script>
    <script src="webseite/map.js?v=20260920-map-close-icon"></script>
    <script src="webseite/script.js?v=20260920-openstreetmap"></script>
<?php require __DIR__ . '/partials/footer.php'; ?>