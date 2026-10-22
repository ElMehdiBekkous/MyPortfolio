import ClientShowroom from '@/components/antadis/ClientShowroom';

export default function AntadisPage() {
  return (
    <>
      {/* 3D Interactive WebGL Showroom Canvas and HUD (Client Component with ssr: false) */}
      <ClientShowroom />

      {/* Semantic Content Structure for Search Engine Bots, Screen Readers and AI Crawlers */}
      <main
        className="sr-only"
        aria-label="Contenu sémantique du Showroom 3D Antadis"
      >
        <article>
          <header>
            <p>Paris · Lausanne — Agence Digitale E-Commerce · Membre Fevad depuis 2018</p>
            <h1>Antadis — Conseil &amp; Expériences Digitales · Intégrateur Technique E-Commerce</h1>
            <p>
              Concept immersif 3D WebGL développé par <strong>El Mehdi Bekkous</strong> en hommage
              à l’univers d’<strong>Antadis</strong>. Conception, refonte, migration et TMA
              e-commerce B2C, B2B, Omnicanal et Headless. Cadrage CX/BX, sélection SI, intégration
              Shopify Plus, Sylius, PrestaShop Platinum, Magento, connecteurs ERP / PIM / CRM / OMS
              et adoption IA appliquée.
            </p>
          </header>

          <section>
            <h2>Pôles Métiers &amp; Accompagnement Stratégique</h2>
            <ol>
              <li>
                <h3>01. Conseil &amp; Transformation Digitale</h3>
                <p>
                  Diagnostic 360°, cadrage de feuille de route e-commerce, sélection agnostique de
                  plateforme selon votre TCO et cadrage des flux SI.
                </p>
              </li>
              <li>
                <h3>02. UX E-Commerce &amp; CRO (Conversion Rate Optimization)</h3>
                <p>
                  Audits ergonomiques, tests A/B continus, simplification mobile-first des tunnels
                  d’achat et études comportementales Hotjar / Google Analytics.
                </p>
              </li>
              <li>
                <h3>03. Studio Créatif &amp; Design d’Expériences UI</h3>
                <p>
                  Direction artistique de marque, design systems modulaires Figma, micro-interactions
                  et storytelling émotionnel orienté performance marchande.
                </p>
              </li>
              <li>
                <h3>04. Ingénierie &amp; Architecture SI Headless</h3>
                <p>
                  Intégration d’architectures découplées (Composable Commerce), APIs REST / GraphQL,
                  synchronisation bidirectionnelle avec vos ERP (SAP, Sage, Microsoft Dynamics) et PIM (Akeneo, Quable).
                </p>
              </li>
              <li>
                <h3>05. TMA, TME &amp; Croissance Continue</h3>
                <p>
                  Tierce Maintenance Applicative, astreintes 24/7 haute disponibilité, optimisations
                  Core Web Vitals et accompagnement continu des équipes e-commerce.
                </p>
              </li>
            </ol>
          </section>

          <section>
            <h2>Écosystème Technologique &amp; Partenariats Stratégiques</h2>
            <ul>
              <li>
                <strong>Shopify Plus :</strong> Partenaire expert en création et replatforming de boutiques
                internationales à fort volume.
              </li>
              <li>
                <strong>PrestaShop :</strong> Agence certifiée PrestaShop Platinum avec plus de 15 ans d’expertise
                sur le framework.
              </li>
              <li>
                <strong>Sylius :</strong> Leading Partner Sylius pour les architectures PHP / Symfony sur-mesure
                complexes et exigeantes.
              </li>
              <li>
                <strong>Adobe Commerce (Magento) :</strong> Expertise historique en plateformes multisites, multidevises
                et catalogues volumineux.
              </li>
              <li>
                <strong>OroCommerce :</strong> Solution dédiée aux processus complexes du B2B (catalogues personnalisés,
                flux devis, workflows de validation).
              </li>
              <li>
                <strong>Planet Proximis :</strong> Commerce unifié pour synchroniser magasins physiques, web et stock centralisé.
              </li>
            </ul>
          </section>

          <section>
            <h2>Études de Cas &amp; Références Clients Clés</h2>
            <ul>
              <li>
                <article>
                  <h3>Heytens — Leader de l’Habillage Sur-Mesure de Fenêtres</h3>
                  <p>
                    Replatforming e-commerce complet sous Sylius, omnicanalité poussée entre les 100+ magasins
                    et la boutique en ligne, configurateur de rideaux sur-mesure en temps réel.
                  </p>
                </article>
              </li>
              <li>
                <article>
                  <h3>Izipizi — Lunetterie Design &amp; Colorée</h3>
                  <p>
                    Déploiement international Shopify Plus multisite, expérience d’achat fluide et immersive,
                    synchronisation logistique mondiale haute cadence.
                  </p>
                </article>
              </li>
              <li>
                <article>
                  <h3>Raymond Weil Genève — Maison d’Horlogerie Suisse Indépendante</h3>
                  <p>
                    Plateforme de vente de montres de luxe sous Adobe Commerce Magento, intégration SI avec
                    l’ERP manufacturier et expérience de marque haute fidélité.
                  </p>
                </article>
              </li>
            </ul>
          </section>

          <section>
            <h2>Implantation Géographique &amp; Contact</h2>
            <p>
              Antadis accompagne ses clients depuis ses agences à <strong>Paris</strong> (Île-de-France) et{' '}
              <strong>Lausanne</strong> (Suisse romande), ainsi qu’à Rambouillet, La Rochelle, Tours et Montpellier.
            </p>
            <p>
              Site officiel : <a href="https://www.antadis.com/">https://www.antadis.com/</a>
            </p>
          </section>

          <footer>
            <p>
              <em>
                Note : Cette page est un concept de démonstration 3D immersif développé par El Mehdi Bekkous
                (Portfolio 2026). Directive robots : noindex, nofollow (environnement de démonstration).
              </em>
            </p>
          </footer>
        </article>
      </main>

      {/* NoScript Fallback for Crawlers or Browsers with JavaScript Disabled */}
      <noscript>
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1e293b' }}>
          <h1 style={{ fontSize: '1.8rem', color: '#e05a47' }}>
            Antadis — Showroom 3D E-Commerce (Paris · Lausanne)
          </h1>
          <p>
            Cette expérience 3D immersive requiert l’activation de JavaScript et WebGL. Pour découvrir les services
            officiels de l’agence Antadis (création, refonte, replatforming Shopify Plus, Sylius, PrestaShop, Magento),
            visitez le site officiel :
          </p>
          <p>
            <a href="https://www.antadis.com/" style={{ color: '#e05a47', fontWeight: 'bold' }}>
              Consulter le site officiel d’Antadis ↗
            </a>
          </p>
        </div>
      </noscript>
    </>
  );
}
