## 2026-03-22 - Progressive Mobile Framerate Loader

**Modified Files:**
- `src/components/sections/Hero.js`

**What Was Done:**
- To balance instant load times with 30 FPS high-quality mobile animation, we implemented a Phase 1 / Phase 2 Web Worker style loader.
- Phase 1 forces the array to only request even frames `i % 2 === 0`, instantly booting the site at 15 FPS.
- Once Phase 1 completes (`framesLoaded === true`), a 1000ms timeout automatically triggers Phase 2 which silently fetches all the odd frames. The `drawFrame` canvas API naturally detects the cache upgrade and seamlessly shifts from 15 FPS to 30 FPS mid-animation!

---

## 2026-03-22 - Bypassing framesLoaded Dev-Server Stall

**Modified Files:**
- `src/components/sections/Hero.js` - Removed `framesLoaded` logic from the animation `startLoop`.

**What Was Done:**
- On a local `npm start` (Next.js dev server), delivering 200 concurrent HTTP requests creates a massive serialized queue inside Node.js.
- The `action` and `idle` GSAP interval loops were previously locked tightly behind `framesLoaded === true`, causing the avatar to freeze for up to 15 seconds while the local server processed every file individually.
- The logic was updated to bind strictly to `firstFrameLoaded`. The `startLoop` now attempts to draw frames instantly. Thanks to the fallback in `drawFrame()` which ignores `img.complete === false`, the canvas flawlessly skips missing frames in real-time. This mimics a YouTube-style "buffering" connection, giving instant visual feedback while the remaining frames load concurrently in the background.

---

## 2026-03-21 - Hero Early Render & GSAP Init

**Modified Files:**
- `src/components/sections/Hero.js` - Prioritize first frame and unblock GSAP ScrollTrigger.

**Infrastructure Used:**
- 🖼️ **State**: `firstFrameLoaded` for prioritizing the first frame display.

**What Was Done:**
- Previously, ScrollTrigger pinning and the first canvas draw were completely blocked until all 200+ frames downloaded. On slow connections, this caused the layout to jump and break.
- Implemented a priority load for `idleFrames.current[0]`. As soon as it parses, we draw it to the canvas.
- Modified GSAP `ScrollTrigger` to mount immediately inside the `Hero` section (`if (!heroRef.current || isMobile === undefined) return;`) without waiting for ANY image frame states, keeping parallax pinning stable and responsive from the start.
- **CRITICAL FIX:** Removed `framesLoaded` from the GSAP `ScrollTrigger` hook dependencies. On slow mobile networks, if the 200 frames finished downloading while the user was scrolling down the pinned area, the hook would re-trigger, run `ctx.revert()`, instantly destroy the pinned 400vh space, and drop the user violently into the `Projects` section. GSAP now strictly mounts only once.

---

## 2026-03-09 - Scroll Freezing & Animation Performance Update

**Modified Files:**
- `src/components/sections/Hero.js` - Complete rewrite of `AvatarFrame` rendering.

**Infrastructure Used:**
- 🖼️ **DOM API**: HTML `<canvas>` instead of `<img srcPattern>`
- 🪝 **Hooks**: `useCallback` to cache the drawing function and pure JS `Image` classes for hard caching frames purely in memory.

**What Was Done:**
- The reason the scrolling was still freezing slightly on fast scrolls is that even when using `frameImgRef.current.src = frame`, the browser still has to decode the WebP image into a bitmap layout for the screen. On fast scrolls (60 scrubs per second), this piles up.
- **Canvas Blitting:** I refactored `<AvatarFrame>` to be a `<canvas>`.
- Now, when the 204 images are downloaded (`new Image()`), I store the actual JS objects inside React `useRef(preloadedImages)`.
- During the `gsap` scroll scrub, instead of changing DOM attributes, the engine calls `ctx.drawImage(img)` which paints the ready-decoded 2D buffer directly to the screen via GPU hardware acceleration.
- This represents the absolute pinnacle of high-performance sequence rendering on the web (the exact same technique Apple uses for their scroll animations).

**Notes:**
- A full browser refresh (`Ctrl+F5` or `Cmd+Shift+R`) is mandatory to reload the DOM structure since we swapped an `<img>` tag out for a `<canvas>` element!
