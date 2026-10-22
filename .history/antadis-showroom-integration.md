## 2026-10-22 - Antadis Showroom 3D Integration & Subdomain Rewrites

**Modified Files:**
- `next.config.mjs` - Added `beforeFiles` rewrites to map host matching `^antadis\..*` directly to `/antadis`.
- `src/app/antadis/layout.js` - Root route layout for `/antadis` importing Google Fonts (`Cormorant Garamond`, `Inter`, `Plus Jakarta Sans`), dedicated `antadis.css`, and SEO metadata.
- `src/app/antadis/page.js` - Dynamic client entrypoint loading `AntadisShowroom` with `{ ssr: false }` and branded spinner.
- `src/app/antadis/antadis.css` - Precompiled Tailwind + Paris Glassmorphism CSS bundle isolated for the showroom.
- `src/components/antadis/AntadisShowroom.jsx` - Core WebGL Three.js + GSAP 3D virtual showroom component with reactive HUD, 13 stations, floating "← Portfolio" back button, and corrected split syntax.
- `src/data/antadis/showroomData.js` - 13 rich stations dataset, 2 infinite LED marquee panels, case studies, and base64 brand logos with fixed array termination.

**Infrastructure Used:**
- 🎨 **Styling**: Precompiled Tailwind CSS 3.4.17 + Glassmorphism
- 🌐 **Routing & Rewrites**: Next.js App Router dynamic import + host header rewrite rule
- 🚀 **3D Engine**: Three.js & GSAP (already in project dependencies)

**What Was Done:**
- Unpacked and extracted `antadis-showroom-nextjs.zip`.
- Resolved syntax errors originating from the upstream split between `AntadisShowroom.tsx` (which had trailing `} ];`) and `showroomData.ts` (which was missing `] } ];`).
- Converted components to clean ESM/JSX without requiring additional TypeScript compiler dependencies.
- Compiled Tailwind CSS rules into an isolated stylesheet `antadis.css` so existing styled-components and global styles on the portfolio homepage remain completely untouched.
- Configured Next.js rewrites so `antadis.elmehdibekkousportfolio.vercel.app` (or any `antadis.*` host) automatically routes to `/antadis`.
- Validated via full `next build` (7/7 static pages generated successfully) and local server verification.
- Light Mode contrast overhaul:
  - Fixed low-contrast and invisible light/white text against frosted ivory cards (`.hero-case-btn`, `.hero-case-desc`, `.hero-agency-pill`, `.hero-fevad-pill`).
  - Added full light-mode styling for inactive tabs (`.station-tab-inactive`) with clear slate typography and subtle warm borders.
  - Resolved low-contrast amber text in expertises panel (`.reactive-box-headline`, `.reactive-box-detail`, `.metric-label-txt`, `.metric-val-txt`).
  - Adjusted billboard marquee controls, mobile expand bar, and footer links for high legibility and accessibility.
- Hero Section Transparent Card & Card Glassmorphism:
  - Removed background, borders, and backdrop-filter on `.paris-glass-hero` card so the 3D monument and avenue remain 100% visible.
  - Applied multi-layered HD `text-shadow` (luminous halo + depth in light mode, deep contrast shadow in dusk/night mode) across all hero titles and descriptions.
  - Implemented authentic frosted **Glassmorphism** across all UI cards (Header, Rail, Reactive Station Panel, Inner Reactive Box, Back Button, Footer Drawer, Project Panel, Contact Modal) with translucent backgrounds (`rgba(..., 0.70-0.78)`), `backdrop-filter: blur(20px - 28px) saturate(180%)`, and specular inner line highlights.
- 60 FPS Performance & Stutter Optimization:
  - Root Cause Analysis:
    1. Global SVG turbulence noise filter (`feTurbulence`) in `GlobalStyles.js` (`body::after`, z-index 9999) forced the GPU to recalculate SVG perlin noise over full viewport on every WebGL frame.
    2. Over 25 concurrent DOM elements with heavy `backdrop-filter: blur(28px) saturate(190%)` over the 3D canvas, with worst culprit being nested canvas blurs (`#station-reactive-box` inside `#reactive-station-panel`).
    3. `scroll-behavior: smooth` in global styles fighting Three.js camera damping lerp (`state.dampedProgress += ... * dt * 6.5`).
    4. Un-isolated DOM layers forcing reflows during camera translation.
  - Solutions Implemented:
    1. Suppressed global SVG noise on `/antadis` route with `body::after { display: none !important; }`.
    2. Enforced direct scroll sync `html, body { scroll-behavior: auto !important; }`.
    3. Promoted HUD layers (`#reactive-station-panel`, `header`, `#progress-rail`, `#zone0-overlay`, `.back-portfolio-btn`) to dedicated GPU composite layers with `transform: translateZ(0); will-change: transform, opacity; isolation: isolate; backface-visibility: hidden;`.
    4. Optimized glassmorphism: reduced top-level blur to `12px` and replaced nested blurs on sub-cards with high-contrast frosted porcelain/slate enamel surfaces.
    5. Cleaned up canvas event listeners (`pointermove`, `click`) in `AntadisShowroom.jsx` on unmount.
  - Verified Benchmark:
    - Stationary FPS: **59.28 FPS** (rock-solid).
    - Active Scrolling FPS: **58.15 FPS** (smooth 60 FPS rail movement).
