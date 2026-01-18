# SurveyDonkey Design Guidelines

## 1. Overall Feel
The application follows a "Modern Professional" aesthetic—blending the reliability of a B2B SaaS tool with the tactile, high-contrast energy of consumer social apps. 
- **Key traits:** Bold, Clean, Responsive, and Tactile.
- **Interactions:** Use smooth CSS transitions, linear-easing for motion, and scale-based feedback (active:scale-95) for all interactive elements.

## 2. Color Palette
- **Brand Teal (Primary):** #14b8a6 (brand-500) to #134e4a (brand-900). Used for primary actions, success states, and key branding.
- **Accent Amber:** #f59e0b. Used sparingly for highlights and visual interest.
- **Surface Slate:** #f8fafc (slate-50) for backgrounds; #ffffff (white) for cards.
- **Text:** #0f172a (slate-900) for primary headings; #64748b (slate-500) for metadata.

## 3. Typography
- **Font Family:** Inter / System Sans-Serif stack.
- **Headers:** `font-black` (900 weight) with `tracking-tight`.
- **Labels:** `text-[10px]` to `text-xs`, `font-black`, `uppercase`, `tracking-[0.2em]`.
- **Body:** `font-medium` or `font-bold` for standard readability.

## 4. Component Geometry (Rounding)
- **Standard Buttons:** `rounded-xl` (12px)
- **Game Buttons:** `rounded-2xl` (16px)
- **Standard Cards:** `rounded-3xl` (24px)
- **Hero Containers:** `rounded-[3rem]` (48px)

## 5. Button Standard (Scale)
- **Small (btn-sm):** `px-3 py-1.5` - Inline actions (Edit/Delete).
- **Base (btn-base):** `px-5 py-2.5` - Primary navigation, tab toggles.
- **Large (btn-lg):** `px-8 py-3` - System actions (Save/Cancel).
- **Hero (btn-hero):** `py-4` (usually w-full) - Game-critical interactions (Start Mission).

## 6. Layout Guidelines
- **Scrollbar:** Always use `scrollbar-gutter: stable` on the HTML root to prevent layout shifts.
- **Container:** Maximum width for dashboards is `max-w-7xl`; for editors `max-w-5xl`.
- **Spacing:** Use a consistent 8px (2 units) scale for margins and padding.
