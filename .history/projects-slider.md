## 2026-03-22 - Projects Browser UI & Staggered Parallax GSAP

**Modified Files:**
- `src/components/sections/Projects.js` - Staggered the GSAP image scroll and added a MacOS Browser frame.

**What Was Done:**
- Previously, all project screenshots scrolled their `object-position: 50% 100%` blindly along the single 95% horizontal sliding timeline, meaning slide 4 was already at the bottom by the time the user reached it.
- Re-architected the `Projects.js` GSAP logic with precise timeline math to stagger each image's scrolling animation so it only active scrubs exactly when its specific slide is panning through the center viewport.
- Encapsulated the `ProjectImage` in an `ImageInnerContainer` and prepended a `BrowserBar` styled component to create a sleek MacOS browser window GUI frame (with red/yellow/green native dots), significantly elevating the premium aesthetic of the screenshot showcase.

---

## 2026-03-22 - Mobile GSAP ScrollThread Jitter Fix

**Modified Files:**
- `src/app/page.js` - Added `normalizeScroll(true)`
- `src/components/sections/Hero.js` - Added `anticipatePin: 1`
- `src/components/sections/Projects.js` - Added `anticipatePin: 1`

**What Was Done:**
- Resolved a visual glitch on mobile where pinned sections completely detached and jittered during rapid, aggressive scrolling.
- This was an architectural desync between the mobile OS's hardware-accelerated scroll thread and GSAP's Javascript thread rendering virtual `position: fixed` coordinates.
- Implemented `ScrollTrigger.normalizeScroll(true)` to proxy native touch scroll strictly onto the Javascript thread, perfectly synchronizing hardware physics with virtual bounds.
- Added `anticipatePin: 1` to both the Hero and Projects GSAP timelines so the GPU actively sub-pixel resolves the fixed boundary milliseconds before the user's velocity physically intersects it.

---

## 2026-03-22 - Mobile Persistent Gap GSAP Hardening

**Modified Files:**
- `src/app/page.js` - Added `ScrollTrigger.config({ ignoreMobileResize: true })`.
- `src/components/sections/Projects.js` - Added inline pixel height lock on mobile.

**What Was Done:**
- To definitively solve the bottom gap caused by the URL bar hiding, we implemented standard GSAP options. First, we passed `ignoreMobileResize: true` to prevent ScrollTrigger from completely recalculating pins on tiny viewport changes.
- Second, we added a `useEffect` inside `Projects.js` to capture the exact `window.innerHeight` on initial load (when the URL bar is visible) and applied it as an inline style variable `--win-height`. By explicitly fixing the physical pixel height identical to the `.pin-spacer`, the background color of the `body` is never revealed when the URL bar hides.

---

## 2026-03-21 - Global ScrollTrigger Async Layout Fix

**Modified Files:**
- `src/app/page.js` - Added a global `ResizeObserver`.

**What Was Done:**
- Traced the bug where the `Projects` section pinned too early (inside the "What I do" section on mobile).
- The root cause was Next.js dynamic imports (`next/dynamic` with `ssr: false`). The `Hero` and `Projects` sections initialized GSAP `ScrollTrigger` immediately on mount, calculating their physical `Y` coordinates based on an empty/loading DOM. When the large `About` and `Skills` chunks finally streamed in and expanded the height of the page, GSAP's cached coordinates remained unchanged. 
- Implemented a global `ResizeObserver` observing `document.body` to fire `ScrollTrigger.refresh()` every time the DOM layout shifts. This forces all scroll triggers to magically recalculate themselves whenever heavy lazy-loaded sections finally render, maintaining pixel-perfect pinning.

---

## 2026-03-21 - Mobile dvh Navigation Gap Fix

**Modified Files:**
- `src/components/sections/Projects.js` - Removed `height: 100dvh`
- `src/components/sections/Hero.js` - Removed `min-height: 100dvh`

**What Was Done:**
- Resolved a critical mobile browser issue where scrolling caused the address bar to hide, expanding the viewport. Because GSAP's `ScrollTrigger` inline-pins the height of the sections in `px` at mount, `100dvh` caused sections to be locked to a smaller value. The page would then show a massive empty gap at the bottom of the section because the viewport had grown by ~100px.
- Reverted pinned component styling strictly to `100vh`. Since `100vh` ignores the dynamic address bar size shifting, it matches the eventual full screen layout perfectly without triggering GSAP resizing bugs.

---

## 2026-03-10 - Project Section: Cinematic Horizontal Slider Rewrite

**Modified Files:**
- `src/components/sections/Projects.js` - Complete rewrite using a sticky horizontal scrolling layout based on user's HTML template.
- `src/data/projects.js` - Added `image` properties using high-quality Unsplash URLs for the parallax slider images.

**Related Files:**
- `src/context/LanguageContext.js` - Used internal `t` function to map localized content (titles and descriptions).

**Infrastructure Used:**
- 🪝 **Hooks**: `useEffect`, `useRef`, `useState`, `useLanguage`
- 📚 **Libraries**: `styled-components`, Tailwind CSS

**What Was Done:**
- Converted standard vertical grid layout for Projects into a 100vh full screen cinematic sticky container.
- Added scroll-linked horizontal translation mapped exactly to `(N - 1) * 100vw`.
- Implemented `Anton` typography, parallax shift for images and titles relative to viewport.
- Handled global cursor intersection to only display correctly over slider elements.
- Retained existing `project` loop mapping, linking, tags and fallback data properly.

**Notes:**
- `Next/image` was intentionally eschewed for standard `<img>` to permit smoother CSS 3D transforms (`scale`, `translate3d`).
- `window.addEventListener('resize')` tracks `maxScroll` bounds.
