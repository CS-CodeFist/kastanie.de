    <footer class="site-footer">
        <div class="site-footer-inner">
            <div class="footer-brand">
                <img src="bilder/kastanie-logo-pur.png" width="44" height="44" alt="">
                <div class="footer-brand-text">
                    <span class="footer-brand-name">Kastanie</span>
                    <span class="footer-brand-detail">BISTRO · CAFE · APARTMENT</span>
                </div>
            </div>
            <nav aria-label="Rechtliche Hinweise">
                <a href="impressum.php">Impressum</a>
                <a href="datenschutz.php">Datenschutz</a>
            </nav>
        </div>
    </footer>
    <?php if (isset($seasonPage)): ?>
    <div class="s-elements" data-season-page="<?= htmlspecialchars($seasonPage, ENT_QUOTES, 'UTF-8') ?>" aria-hidden="true"></div>
    <script src="seasons/seasons.js?v=20260919-page-seasons"></script>
    <?php endif; ?>
</body>
</html>
