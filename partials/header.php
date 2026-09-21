<?php
$pageTitle = $pageTitle ?? 'Kastanie Moltzow';
$isHomepage = $isHomepage ?? false;
$hasSectionNavigation = $hasSectionNavigation ?? $isHomepage;
$navigationLabel = $navigationLabel ?? 'Hauptnavigation';
$pageDescription = $pageDescription ?? 'Kastanie in Moltzow: Bistro, Cafe und Apartments. Entdecken Sie unsere aktuelle Speisekarte und unsere Unterkünfte.';
$pageUrl = 'https://www.bistro-kastanie.de' . ($pagePath ?? '/');
$previewImageUrl = 'https://www.bistro-kastanie.de/bilder/icons/social-preview.png';
$requestHost = $_SERVER['HTTP_HOST'] ?? '';
$requestScheme = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
if (preg_match('/\A(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])(?::[0-9]{1,5})?\z/i', $requestHost)) {
    $requestOrigin = $requestScheme . '://' . $requestHost;
    if (filter_var($requestOrigin, FILTER_VALIDATE_URL)) {
        $installPath = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php'), '/.');
        $previewImageUrl = $requestOrigin . $installPath . '/bilder/icons/social-preview.png';
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php if (isset($baseHref)): ?>
    <base href="<?= htmlspecialchars($baseHref, ENT_QUOTES, 'UTF-8') ?>">
    <?php endif; ?>
    <meta name="description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
    <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="canonical" href="<?= htmlspecialchars($pageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="theme-color" content="#dfcb97">
    <meta name="application-name" content="Kastanie Moltzow">
    <meta name="apple-mobile-web-app-title" content="Kastanie">
    <link rel="icon" href="favicon.ico" sizes="16x16 32x32 48x48">
    <link rel="icon" type="image/png" sizes="32x32" href="bilder/icons/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="bilder/icons/favicon-16.png">
    <link rel="icon" type="image/svg+xml" sizes="any" href="bilder/kastanie-logo.svg">
    <link rel="apple-touch-icon" sizes="180x180" href="bilder/icons/apple-touch-icon.png">
    <link rel="manifest" href="site.webmanifest">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="de_DE">
    <meta property="og:site_name" content="Kastanie Moltzow">
    <meta property="og:title" content="<?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:url" content="<?= htmlspecialchars($pageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image" content="<?= htmlspecialchars($previewImageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Logo der Kastanie Moltzow: grünes Kastanienblatt mit weißem K">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($previewImageUrl, ENT_QUOTES, 'UTF-8') ?>">
    <meta name="twitter:image:alt" content="Logo der Kastanie Moltzow: grünes Kastanienblatt mit weißem K">
    <?php if ($isHomepage && isset($website)): ?>
    <script type="application/ld+json">
    <?= json_encode($website->restaurantSchema(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_INVALID_UTF8_SUBSTITUTE) ?>
    </script>
    <?php endif; ?>
    <script>
        let initialMode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        try {
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode === 'dark' || savedMode === 'light') initialMode = savedMode;
        } catch (error) {}
        document.documentElement.dataset.theme = initialMode;
        document.querySelector('meta[name="theme-color"]').content = initialMode === 'dark' ? '#2d2922' : '#dfcb97';
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Handlee&family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css?v=20260920-theme-toggle">
    <?php if (isset($seasonPage)): ?>
    <link rel="stylesheet" href="seasons/seasons.css?v=20260919-hidden-test">
    <?php endif; ?>
</head>
<body>
    <header class="site-header">
        <div class="site-header-inner">
            <a class="brand brand-wordmark" href="./#start" aria-label="Kastanie Moltzow - Startseite">
                <?php
                $logoDocument = new DOMDocument();
                $logoDocument->load(__DIR__ . '/../bilder/kastanie-logo-schriftzug.svg', LIBXML_NONET);
                $logoRoot = $logoDocument->documentElement;
                $logoRoot->setAttribute('aria-hidden', 'true');
                $logoRoot->setAttribute('focusable', 'false');
                $logoXPath = new DOMXPath($logoDocument);
                $logoXPath->registerNamespace('svg', 'http://www.w3.org/2000/svg');
                foreach ($logoXPath->query('//svg:path | //svg:rect') as $logoPath) {
                    if (strpos($logoPath->getAttribute('style'), 'fill:url(') === false) {
                        $logoPath->setAttribute('style', 'fill:currentColor;fill-rule:nonzero;');
                    }
                }
                echo $logoDocument->saveXML($logoRoot);
                ?>
            </a>
                <nav id="navigation" aria-label="<?= htmlspecialchars($navigationLabel, ENT_QUOTES, 'UTF-8') ?>">
                    <div class="navigation-items">
                        <?php if (isset($website)): $website->navigation(); endif; ?>
                        <?php if (!$hasSectionNavigation): ?>
                        <a href="./#start">Zurück zur Startseite</a>
                        <?php endif; ?>
                    </div>
                </nav>
        </div>
    </header>
    <button class="dark-mode-toggle" id="darkModeToggle" type="button" aria-label="Hell- oder Dunkelmodus umschalten">
        <span class="sun-icon" aria-hidden="true">☀️</span>
        <span class="moon-icon" aria-hidden="true">🌙</span>
    </button>
    <script src="scripts/theme.js?v=20260920-shared-scripts" defer></script>
