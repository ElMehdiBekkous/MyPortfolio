## 2026-03-22 - Testimonials Background Blue Override

**Modified Files:**
- `src/components/sections/Testimonials.js` - Changed custom cursors (`CursorRing`, `CursorDot`) and interactive Canvas Particles to use Blue instead of the global theme color.

**What Was Done:**
- Following the global switch to the Emerald Green brand palette, the user requested that the Testimonials section's interactive geometric background be changed to Blue to visually "break" the monochrome flow of the page.
- Overrode the `theme.colors.accent` fallbacks inside the Canvas render loop and fixed HTML cursor cursors to use bright Sky Blue (`#0EA5E9`) and True Blue (`#3B82F6`), creating a stunning visual contrast when the user scrolls down to that section.
