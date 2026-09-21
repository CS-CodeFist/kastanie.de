<?php
$pageTitle = 'Apartments | Kastanie Moltzow';
$pageDescription = 'Entdecken Sie die Apartments der Kastanie in Moltzow. Bilder, Informationen zu den Unterkünften und Kontakt für Ihre Anfrage.';
$pagePath = '/apartments';
$baseHref = '../';
$hasSectionNavigation = true;
$navigationLabel = 'Apartments-Navigation';
$seasonPage = 'apartments';
require_once __DIR__ . '/partials/website.php';
$website = new WebsiteRenderer('apartments');
require __DIR__ . '/partials/header.php';
?>
    <main id="content" aria-live="polite">
        <?php $website->render(); ?>
    </main>

    <script src="scripts/opening-hours.js?v=20260920-shared-scripts"></script>
    <script src="scripts/map.js?v=20260921-coffee-land"></script>
    <script src="scripts/website.js?v=20260920-server-render"></script>
<?php require __DIR__ . '/partials/footer.php'; ?>