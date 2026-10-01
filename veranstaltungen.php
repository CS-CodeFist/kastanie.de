<?php
$pageTitle = 'Veranstaltungen | Kastanie Moltzow';
$pageDescription = 'Veranstaltungen in der Kastanie Moltzow: aktuelle Termine, Informationen und Kontakt.';
$pagePath = '/veranstaltungen/';
$baseHref = '../';
$hasSectionNavigation = true;
$navigationLabel = 'Veranstaltungen-Navigation';
$seasonPage = 'veranstaltungen';
require_once __DIR__ . '/partials/website.php';
$website = new WebsiteRenderer('veranstaltungen');
require __DIR__ . '/partials/header.php';
?>
    <main id="content" aria-live="polite">
        <?php $website->render(); ?>
    </main>

    <script src="scripts/opening-hours.js?v=20260923-event-exceptions"></script>
    <script src="scripts/map.js?v=20260921-coffee-land"></script>
    <script src="scripts/website.js?v=20260923-event-lifecycle"></script>
<?php require __DIR__ . '/partials/footer.php'; ?>