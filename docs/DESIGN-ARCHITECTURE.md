# Design Architecture

This is the visual direction for the product described in [PRD.md](../PRD.md). The goal is to mirror the feel of the reference, but tune it for this freemium AI video funnel. The reference is a premium creator dashboard. The product should feel the same: dark, calm, confident, and warm.

The mockup at [docs/mockup.html](mockup.html) is the source of truth for the values below. When the doc and the mockup disagree, update the doc.

## 1. DESIGN GOAL
The product should feel like a creative workspace, not a generic SaaS page. The reference has a dark base, a narrow left rail, tool-like actions, and a strong top-right utility area with a credit value. We should keep that structure and adapt the palette to warm autumn tones.

This project is not a large app. The design should stay simple, premium, and easy to use. The goal is to make the product feel valuable without adding clutter.

## 2. SAMPLE SCREEN STRUCTURE
The main workspace should look like this:

- left sidebar with a small brand mark and navigation
- main content area with a top toolbar and tabs
- a list of generated or uploaded assets in rows
- top-right area with a small rounded credit badge, for example 42 credits
- action buttons for generate and upload flows
- neutral but rich dark surfaces with soft borders

The credit badge should always reflect the real balance. Users start with 50 credits and a full video costs 10, so the badge should read like a live number, not a decorative score.

The reference shows a wide working canvas with large spacing and a calm layout. We should keep that same rhythm.

## 3. COLOR SYSTEM
Use a brown-first palette with warm, earthy contrast.

- background: deep brown black
- elevated panels: warm charcoal brown
- borders: bronze, taupe, and muted brown
- text: warm white and soft ivory
- secondary text: taupe, stone, soft beige
- accent: rust, burnt orange, amber, chestnut
- highlight: pale sand or wheat for subtle emphasis

The dark mode should be the default. The light mode should be softer and more editorial, but the same brown family should remain the core brand color.

### Tokens
These are the values used in the mockup. Expose them as CSS variables or Mantine theme colors under the same names.

| Token | Dark (default) | Light |
| --- | --- | --- |
| bg | #16110d | #f4ede1 |
| panel | #1e1712 | #fdf8f0 |
| panel-2 (raised surface, chips, inputs, hover) | #271e17 | #f0e6d5 |
| border | #3b2d1f | #dccbb0 |
| ink | #f1e9db | #26190f |
| dim (secondary text) | #a8967e | #6f5c48 |
| rust (primary action) | #b85c33 | #a24a25 |
| amber (highlight, credits, progress) | #d79b46 | #9c6a1f |

Light mode is not a plain inversion. Rust and amber are darkened one step so they keep contrast as text on ivory. Everything else keeps the same role.

### Status colors
Semantic color stays inside the brown family. There is no green, blue, or bright red.

- Rendering: rust text on a rust tint
- Rendered: amber text on an amber tint
- Draft: dim ink on the raised surface with a thin border
- Completed stage checks: amber, not green
- Failed: rust, reusing the Rendering treatment with a different label

## 4. TYPOGRAPHY
Use Plus Jakarta Sans from Google Fonts as the only typeface. It is the closest open face to Google Sans, which is not licensable. Load weights 400, 500, 600, and 700 and declare a system sans fallback.

Rules:
- headings: 700, tight letter spacing, balanced wrapping
- section and card titles: 600 to 700
- buttons, chips, row titles: 600
- labels and navigation: 500
- body text: 400 with good line spacing
- eyebrows and column headers: 11px, 600, uppercase, letter-spaced
- micro text: dim ink, not hard black
- numbers that line up in columns: tabular figures

We should keep the text system clean and compact. The UI should read quickly and feel premium without over-styling.

## 5. COMPONENT STYLE PATTERN
The product should use a small set of polished components.

- Sidebar item: rounded, low-noise, neutral icon and text. The active item gets the raised surface, a thin border, and an amber icon.
- Free tag: small uppercase amber pill next to the MP3 to MP4 nav item.
- Plan card: sits at the bottom of the sidebar. Shows the plan name, the credit count, a thin amber meter, the cost of a full video, and the link to earn more credits.
- Top utility pill: rounded capsule with small score or value
- Tab group: subtle segmented control with soft active state
- Free-tool banner: panel surface with a 3px amber rule on the left. It explains that MP3 to MP4 is free without an account and points to signup for full videos.
- Render job card: song title, Rendering chip, decorative waveform with the rendered portion in amber, a four-step stage list, a progress bar, and the reserved-credits note.
- Result card: 16:9 poster with a centered play button and a duration pill, then Download MP4 as the primary action and Copy share link as the secondary.
- Asset row: dark card with a waveform thumb, name and type line, length, status chip, date, and a more-actions button.
- CTA button: rust fill with ivory text and a soft rust glow
- Secondary button: panel surface with a thin inset border
- Upload button: secondary style with an upload icon
- Credits badge: compact amber pill in the top-right, styled like the reference
- Theme toggle: icon-only button in the toolbar that switches between dark and light

No fancy effects. The interface should stay clean and direct. The mood comes from color, spacing, and contrast, not from excessive decoration.

### Shape and spacing
- radii: 20px for cards, 12px for inner surfaces, inputs, and rows, 8px for small controls, full pill for chips, tabs, and badges
- borders: 1px bronze, never heavier
- shadows: a 1px border ring plus a soft amber glow on cards, a lighter version on rows
- sidebar width: 232px
- content gutters: 28px, max content width 1240px
- gap between major blocks: 22px

## 6. DARK MODE PRIORITY
The dark mode should be the primary design. This is what the reference is doing. The warm brown palette looks strongest in a dark surface.

Dark mode should include:
- deep brown background
- medium warm-gray cards
- soft amber accent highlights
- ivory text for clarity
- subtle glow around active buttons or important panels

Light mode should exist as a comfortable alternative, but it should not feel like a different design system. It should just be a softer version of the same theme. It is applied with a `data-theme="light"` attribute on the root element that overrides the same variables. Dark is the default regardless of system preference, and the user's choice is remembered locally.

## 7. INTERACTION STYLE
The interface should feel premium but quiet.

- soft shadow on cards
- subtle hover lift of 1px on buttons and rows
- minimal motion
- sharp focus states
- rounded actions with calm contrast

Motion budget: only two things move. The render progress bar creeps slowly, and the dot on the current stage pulses. There are no entrance animations. Both animations are switched off under `prefers-reduced-motion`.

Accessibility: keyboard focus shows a 2px amber outline with a 2px offset on every interactive element. Icon-only buttons carry an aria label. The stage list uses `aria-current="step"` and the progress bar exposes its value.

## 8. RESPONSIVE BEHAVIOR
- below 1040px: the library hides the length and date columns
- below 900px: the sidebar becomes a top strip with the brand, a horizontal scrolling nav, a compact credits pill, and the avatar. The two cards stack.
- below 640px: the library header row is hidden and secondary buttons collapse to their icon

The page body never scrolls sideways. Wide content scrolls inside its own container.

## 9. PRODUCT-SPECIFIC DIRECTION
For this project, the core concept is a creator workspace with a freemium funnel.

The UI should support three moments clearly:
- free tool usage
- signup prompt before generation
- generation dashboard with credits and status

The mockup covers the first and third moments. The signup-before-render modal is not designed yet and should follow the same card style: 20px radius, panel surface, rust primary action.

The top-right credit value should be a visual anchor. It should feel like a live product metric, not a decoration. The whole interface should make the user feel that the system is active, premium, and ready to create.

Brand name: the mockup uses "Ember" as a placeholder mark. This is not final and should be confirmed before the landing page is built.

## 10. BROWSER PREVIEW LINKS
Local app preview:
- http://localhost:3000

Final mockup preview:
- https://claude.ai/code/artifact/02c7f139-ef8a-4984-8a82-e24d2e57c83a
- source: [docs/mockup.html](mockup.html), open it directly in a browser

Related docs:
- [PRD.md](../PRD.md)
- [docs/ARCHITECTURE-FE.md](ARCHITECTURE-FE.md)
- [docs/ARCHITECTURE-BE.md](ARCHITECTURE-BE.md)

This direction keeps the product close to the reference mood, while making it fit this project’s funnel, credit model, and workflow. The goal is a warm brown creator dashboard that feels premium and calm, not copied from any single external source.
