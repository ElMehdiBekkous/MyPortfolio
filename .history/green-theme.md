## 2026-03-22 - Global Theme Color Change (Purple to Emerald Green)

**Modified Files:**
- `src/styles/theme.js` - Complete overhaul of the `light` and `dark` theme palettes.
- `src/components/sections/Hero.js` - Changed the massive background `GradientMesh` and `OrbitDot` elements to use Green/Cyan colors.
- `src/components/PreferencesPopup.js` - Changed the decorative `FloatingOrb` to use Green.

**What Was Done:**
- To better align with the eco-friendly focus of the user's primary showcase projects (LaEcoVida, Enrgestion), the primary brand color was shifted from a generic tech Purple (`#6C63FF`) to a vibrant and organic Emerald Green (`#10B981`).
- The accent gradients were updated to flow beautifully from Emerald to Cyan to Blue (`#10B981` -> `#0EA5E9` -> `#6366F1`) in Light Mode, creating a premium modern aesthetic.
- Hardcoded hex values for decorative orbs and meshes in the Hero section and Preferences UI were tracked down and swapped manually to maintain visual cohesion across the entire application interface.
