## 2026-03-22 - LaEcoVida & Enrgestion Projects Integration

**Modified Files:**
- `src/i18n/{fr,en,ar}.js` - Replaced placeholder `.items` with the 4 custom projects (LaEcoVida, Enrgestion, Admin, Boutique)
- `src/data/projects.js` - Shrunk array length from 6 mock projects to 4 real ones.
- `src/components/sections/Projects.js` - Rebuilt the GSAP parallax logic to utilize `object-position: 50% 100%` on ultra-tall images, enabling vertical scrolling mapped to horizontal scrubbing.

**Infrastructure Used:**
- ⚙️ **Config**: Puppeteer (temp script) for rendering Vercel deployments and dumping full-page screenshots to `public/projects`.

**What Was Done:**
- Developed a temporary Node.js script using Puppeteer to navigate to all 4 URLs, wait 3 extra seconds for animations to resolve, and save them automatically as `1440w x Full height` JPEG files directly into the Next.js `public` directory.
- Upgraded the `Projects.js` `ImageWrapper` so that the newly ingested tall images fit exactly to width, with the height bleeding over invisibly via `object-fit: cover`.
- Mapped GSAP `tl.to(img, { objectPosition: "50% 100%" })` inside the `.parallax-bg` block so pulling the scrollbar to the right physically scrolls the inner website screenshot from the header down to the footer! It feels like a high-end agency portfolio!
