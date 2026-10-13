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

## 2026-10-13 - Maktabt.com & ArropaTuCasa Projects Replacement

**Modified Files:**
- `src/data/projects.js` - Replaced `LaEcoVida Admin` and `LaEcoVida Boutique` with `Maktabt.com` (`https://www.maktabt.com/`) and `ArropaTuCasa` (`https://www.arropatucasa.es/`).
- `src/i18n/{fr,en,ar}.js` - Localized titles, subtitles, and descriptions for Maktabt.com and ArropaTuCasa across French, English, and Arabic.
- `public/projects/maktabt.jpg`, `public/projects/arropatucasa.jpg` - Captured and added high-resolution screenshots for both live web platforms.
- `capture.mjs` - Updated project sites array to keep automation in sync.

**Infrastructure Used:**
- 📚 **Libraries**: `puppeteer`
- 🎨 **Styles**: Custom theme accents (`#059669` emerald for Maktabt, `#3B97D4` sky blue for ArropaTuCasa).

**What Was Done:**
- Removed `LaEcoVida Admin` and `LaEcoVida Boutique` from portfolio showcase.
- Integrated `Maktabt.com` (school supplies marketplace connecting Moroccan parents and local bookstores via WhatsApp).
- Integrated `ArropaTuCasa` (Spanish home thermal insulation CleanTech platform with dynamic energy savings calculator).
- Generated high-quality website screenshot assets and linked them in project data.
- Updated LaEcoVida production URL from Vercel deployment to official domain `https://www.laecovida.fr/` and refreshed full-page screenshot asset `public/projects/laecovida.jpg`.

## 2026-10-13 - Projects Reordering, Full-Page Screenshots & Real-Time Image Preload

**Modified Files:**
- `src/data/projects.js` - Reordered projects so Enrgestion is the 4th (last) project: `[LaEcoVida, Maktabt.com, ArropaTuCasa, Enrgestion]`.
- `src/i18n/{fr,en,ar}.js` - Reordered project translation items to match `projects.js`.
- `src/app/layout.js` - Added `<link rel="preload" as="image" href="...">` for all 4 project images in `<head>` to trigger instant browser downloads upon initial page load.
- `src/components/Preloader.js` - Injected image prefetching logic during the 3.2s preloader intro animation to warm up browser memory cache.
- `src/components/sections/Projects.js` - Enabled `priority={true}` and `unoptimized={true}` on all project cards so images display in real-time with zero lag or on-the-fly Sharp resizing delay.
- `public/projects/maktabt.jpg` - Captured true full-page screenshot (1440 x 4979) with all sections, WhatsApp mockups, and merchant portal.
- `public/projects/arropatucasa.jpg` - Captured true full-page screenshot (1440 x 9312) in clean light mode, with cookie banner dismissed via CSS and all sections rendered.

**Infrastructure Used:**
- ⚙️ **Browser Automation**: Puppeteer with host-resolver-rules routing to Vercel Anycast edge and CSS cookie hiding.
- 🚀 **Next.js Preload**: Static preloading via `<head>` links + `Preloader.js` image cache.

**What Was Done:**
- Moved Enrgestion to be the last project.
- Captured complete full-page tall screenshots for Maktabt.com and ArropaTuCasa, providing deep vertical GSAP parallax scrubbing.
- Solved the image loading delay by preloading all project assets during page load and preloader playback.
- Fixed per-slide parallax start offset: previously `(i - 1) * segment` triggered slide `i` while slide `i - 1` was still active, causing images to scroll to the bottom off-screen before becoming visible. Replaced with strict `fromTo` locking `objectPosition: "50% 0%"` until each slide arrives into the active viewport.

