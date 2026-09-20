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

    <script src="scripts/opening-hours.js?v=20260920-shared-scripts"></script>
    <script src="scripts/map.js?v=20260920-map-spacing"></script>
    <script src="scripts/website.js?v=20260920-shared-scripts"></script>
<?php require __DIR__ . '/partials/footer.php'; ?>