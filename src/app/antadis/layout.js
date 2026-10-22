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
  title: 'Antadis — Agence Digitale E-Commerce | Showroom 3D Paris · Lausanne',
  description:
    'Antadis — Agence digitale e-commerce à Paris et Lausanne. Conseil & expériences digitales, intégrateur technique (Shopify Plus, Sylius, PrestaShop, Magento), B2C, B2B et Omnicanal. Présenté par El Mehdi Bekkous.',
  openGraph: {
    title: 'Antadis — Agence Digitale E-Commerce | Showroom 3D Paris · Lausanne',
    description: 'Expérience interactive 3D WebGL (Three.js & GSAP).',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function AntadisLayout({ children }) {
  return (
    <div className={`antadis-root-wrapper ${cormorant.variable} ${inter.variable} ${jakarta.variable}`}>
      {children}
    </div>
  );
}
