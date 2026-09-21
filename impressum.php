<?php
$pageTitle = 'Impressum | Kastanie Moltzow';
$pageDescription = 'Impressum der Kastanie in Moltzow: Angaben zum Betreiber und Kontaktinformationen.';
$pagePath = '/impressum.php';
require __DIR__ . '/partials/header.php';
?>
    <main class="legal-page">
        <article>
            <p class="eyebrow">Rechtliche Hinweise</p>
            <h1>Impressum</h1>
            <section>
                <h2>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</h2>
                <p>Betreiber: Sebastian Giese<br>Kastanie<br>Bistro Cafe Apartment<br>Warener Straße 3<br>17194 Moltzow</p>
            </section>
            <section>
                <h2>Kontakt</h2>
                <p>Telefon: <a href="tel:+4939933736022">+49 (0) 39933 736 022</a><br>
                Telefax: +49 (0) 39933 736 022<br>
                E-Mail: <a href="mailto:info@bistro-kastanie.de">info@bistro-kastanie.de</a></p>
            </section>
            <?php
            /*
             * Vor Veröffentlichung prüfen und gegebenenfalls ergänzen:
             * - Bei erlaubnispflichtigem Betrieb: zuständige Aufsichtsbehörde
             *   laut Erlaubnis mit Name, Anschrift und Website (§ 5 Abs. 1 Nr. 3 DDG).
             * - Rechtsform und gegebenenfalls Registergericht, Registerart und
             *   Registernummer bestätigen; bei juristischen Personen Vertretungsberechtigte nennen.
             * - Falls erteilt: USt-IdNr. nach § 27a UStG oder Wirtschafts-Identifikationsnummer
             *   nach § 139c AO ergänzen. Keine normale Steuernummer veröffentlichen.
             */
            ?>
            <section>
                <h2>Verbraucherstreitbeilegung</h2>
                <p>Hinweis gemäß § 36 Verbraucherstreitbeilegungsgesetz (VSBG): Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
            </section>
        </article>
    </main>
<?php require __DIR__ . '/partials/footer.php'; ?>
