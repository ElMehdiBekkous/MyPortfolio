import { Cormorant_Garamond, Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './antadis.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Antadis — Showroom 3D E-Commerce | Expérience Interactive Paris · Lausanne',
  description:
    'Concept de Showroom 3D immersif pour Antadis, agence digitale e-commerce (Paris & Lausanne). Réalisé avec Three.js & GSAP par El Mehdi Bekkous. Conseil, intégration SI (Shopify Plus, Sylius, PrestaShop, Magento) et études de cas clients.',
  keywords: [
    'Antadis',
    'Agence Digitale E-Commerce',
    'Showroom 3D',
    'Three.js',
    'WebGL',
    'GSAP',
    'Shopify Plus',
    'Sylius',
    'PrestaShop Platinum',
    'Adobe Commerce Magento',
    'OroCommerce',
    'Paris',
    'Lausanne',
    'El Mehdi Bekkous',
    'Portfolio 3D Concept',
  ],
  authors: [
    { name: 'El Mehdi Bekkous', url: 'https://elmehdibekkousportfolio.vercel.app' },
    { name: 'Antadis', url: 'https://www.antadis.com' },
  ],
  creator: 'El Mehdi Bekkous',
  publisher: 'El Mehdi Bekkous',
  metadataBase: new URL('https://antadis.elmehdibekkousportfolio.vercel.app'),
  alternates: {
    canonical: 'https://antadis.elmehdibekkousportfolio.vercel.app',
  },
  openGraph: {
    title: 'Antadis — Showroom 3D E-Commerce | Concept Interactif Paris · Lausanne',
    description:
      'Explorez le showroom 3D interactif au pied de la Tour Eiffel : expertises e-commerce, partenaires officiels (Shopify Plus, Sylius, PrestaShop) et études de cas clients.',
    url: 'https://antadis.elmehdibekkousportfolio.vercel.app',
    siteName: 'Antadis Showroom 3D · El Mehdi Bekkous Portfolio',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/projects/antadis-showroom-og.png',
        width: 1440,
        height: 900,
        alt: 'Showroom 3D Antadis — Vue panoramique Avenue & Tour Eiffel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Antadis — Showroom 3D E-Commerce | Paris · Lausanne',
    description:
      'Concept de showroom 3D interactif Three.js & GSAP créé par El Mehdi Bekkous pour valoriser l’expertise digitale d’Antadis.',
    images: ['/projects/antadis-showroom-og.png'],
    creator: '@elmehdibekkous',
  },
  // Explicit noindex directive as requested: concept prototype not for Google indexation
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'concept-disclaimer':
      'Showroom prototype and creative technology concept created for portfolio demonstration purposes.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// JSON-LD Structured Data Schema for search engines and AI crawlers
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CreativeWork',
      '@id': 'https://antadis.elmehdibekkousportfolio.vercel.app/#showroom',
      name: 'Antadis — Showroom 3D E-Commerce (Concept Prototype)',
      headline: 'Conseil & Expériences Digitales · Intégrateur Technique E-Commerce',
      description:
        'Expérience web 3D immersive en WebGL (Three.js et GSAP) représentant l’univers d’Antadis, agence digitale e-commerce basée à Paris et Lausanne, avec ses pôles d’expertise (Conseil, UX/UI, Intégration SI, TMA/TME), ses partenaires technologiques et ses études de cas clients.',
      url: 'https://antadis.elmehdibekkousportfolio.vercel.app',
      inLanguage: 'fr-FR',
      isAccessibleForFree: true,
      creator: {
        '@type': 'Person',
        name: 'El Mehdi Bekkous',
        jobTitle: 'Full Stack & Creative 3D Developer',
        url: 'https://elmehdibekkousportfolio.vercel.app',
      },
      sourceOrganization: {
        '@type': 'Organization',
        name: 'Antadis',
        url: 'https://www.antadis.com',
        description: 'Agence digitale e-commerce spécialisée B2C, B2B et Omnicanal (Paris · Lausanne)',
        address: [
          {
            '@type': 'PostalAddress',
            addressLocality: 'Paris',
            addressCountry: 'FR',
          },
          {
            '@type': 'PostalAddress',
            addressLocality: 'Lausanne',
            addressCountry: 'CH',
          },
        ],
      },
      about: [
        { '@type': 'Thing', name: 'E-Commerce B2C & B2B' },
        { '@type': 'Thing', name: 'Shopify Plus' },
        { '@type': 'Thing', name: 'Sylius' },
        { '@type': 'Thing', name: 'PrestaShop Platinum' },
        { '@type': 'Thing', name: 'Adobe Commerce Magento' },
        { '@type': 'Thing', name: 'OroCommerce' },
        { '@type': 'Thing', name: 'Three.js & WebGL 3D Visualization' },
      ],
      thumbnailUrl: 'https://antadis.elmehdibekkousportfolio.vercel.app/projects/antadis-showroom-og.png',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://antadis.elmehdibekkousportfolio.vercel.app/#website',
      name: 'Antadis Showroom 3D',
      url: 'https://antadis.elmehdibekkousportfolio.vercel.app',
      publisher: {
        '@type': 'Person',
        name: 'El Mehdi Bekkous',
      },
    },
  ],
};

export default function AntadisLayout({ children }) {
  return (
    <div className={`antadis-root-wrapper ${cormorant.variable} ${inter.variable} ${jakarta.variable}`}>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      {children}
    </div>
  );
}
