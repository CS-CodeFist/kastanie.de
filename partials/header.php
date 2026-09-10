<?php
$pageTitle = $pageTitle ?? 'Kastanie Moltzow';
$isHomepage = $isHomepage ?? false;
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Kastanie Moltzow - Restaurant und Cafe in Moltzow.">
    <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <script>
        try {
            const savedMode = localStorage.getItem('darkMode');
            document.documentElement.dataset.theme = savedMode || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        } catch (error) {}
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Handlee&family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="webseite/styles.css?v=20260910b">
</head>
<body>
    <header class="site-header">
        <div class="site-header-inner">
            <a class="brand" href="./#start" aria-label="Kastanie Moltzow - Startseite">
                <img src="bilder/Kastanie.svg" alt="">
                <span>Kastanie Moltzow</span>
            </a>
            <?php if ($isHomepage): ?>
                <nav id="navigation" aria-label="Hauptnavigation">
                    <div class="navigation-items"></div>
                </nav>
            <?php else: ?>
                <nav id="navigation" aria-label="Hauptnavigation">
                    <div class="navigation-items">
                        <a href="./#start">Startseite</a>
                    </div>
                </nav>
            <?php endif; ?>
        </div>
    </header>
    <button class="dark-mode-toggle" id="darkModeToggle" type="button" aria-label="Hell- oder Dunkelmodus umschalten">
        <span class="sun-icon" aria-hidden="true">☀️</span>
        <span class="moon-icon" aria-hidden="true">🌙</span>
    </button>
    <script src="webseite/theme.js?v=20260904a" defer></script>
