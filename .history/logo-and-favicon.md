## 2026-03-09 - Global Logo and Favicon Update

**Modified Files:**
- `src/components/sections/Navbar.js` - Replaced text `EMB.` logo with the new dynamic SVG logo. 
- `src/components/sections/Footer.js` - Replaced text logo inside `<BrandName>` with the new SVG logo.
- `src/app/icon.svg` - Developed a new favicon.svg responsive to system light (`#1A1A2E`) and dark (`#F0F0FF`) mode preferences via CSS `@media (prefers-color-scheme: dark)`.

**New Files:**
- `src/components/Logo.js` - Extracted the `{EMB}` logo from the Intro animation into a reusable SVG component bound to `styled-components` theming context, adjusting fill color appropriately.

**Infrastructure Used:**
- 🪝 **Hooks/Theming**: `styled-components` props handling (`({ theme }) => theme.colors.text`) dynamically applies current theme preferences across website instances.
- ⚙️ **Config**: `src/app/icon.svg` is inherently supported by Next.js app directory as an automatic favicon metadata route.

**What Was Done:**
- Implemented global logo standardization making the visual appearance strictly mirror the `Intro` `{EMB}` presentation.
- Implemented a resilient UI implementation compatible smoothly with both browser light & dark modes.

**Notes:**
- Replaced previous basic text brand anchors.
- Added smooth hover scaling (1.05) to logo implementations for polish.
