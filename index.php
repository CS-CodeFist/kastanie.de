<?php
$pageTitle = 'Kastanie Moltzow | Bistro, Cafe und Apartments';
$isHomepage = true;
$seasonPage = 'webseite';
require_once __DIR__ . '/partials/website.php';
$website = new WebsiteRenderer('webseite');
require __DIR__ . '/partials/header.php';
?>
    <main id="content" aria-live="polite">
        <?php $website->render(); ?>
    </main>

    <script src="scripts/opening-hours.js?v=20260923-event-exceptions"></script>
    <script src="scripts/map.js?v=20260921-coffee-land"></script>
    <script src="scripts/website.js?v=20260923-section-anchor"></script>
<?php require __DIR__ . '/partials/footer.php'; ?>
