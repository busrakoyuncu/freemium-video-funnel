# Design Architecture

This is the visual direction for the product described in [PRD.md](../PRD.md). The goal is to mirror the feel of the reference, but tune it for this freemium AI video funnel. The reference is a premium creator dashboard. The product should feel the same: dark, calm, confident, and warm.

## 1. DESIGN GOAL
The product should feel like a creative workspace, not a generic SaaS page. The reference has a dark base, a narrow left rail, tool-like actions, and a strong top-right utility area with a credit value. We should keep that structure and adapt the palette to warm autumn tones.

This project is not a large app. The design should stay simple, premium, and easy to use. The goal is to make the product feel valuable without adding clutter.

## 2. SAMPLE SCREEN STRUCTURE
The main workspace should look like this:

- left sidebar with a small brand mark and navigation
- main content area with a top toolbar and tabs
- a list of generated or uploaded assets in rows
- top-right area with a small rounded credit badge like 145
- action buttons for generate and upload flows
- neutral but rich dark surfaces with soft borders

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

## 4. TYPOGRAPHY
Use Google Sans as the main typeface. It matches the reference mood well. It feels precise, modern, and product-ready.

Rules:
- headings: medium to semibold weight
- labels: clear and compact
- body text: regular with good line spacing
- micro text: soft gray or beige, not hard black

We should keep the text system clean and compact. The UI should read quickly and feel premium without over-styling.

## 5. COMPONENT STYLE PATTERN
The product should use a small set of polished components.

- Sidebar item: rounded, low-noise, neutral icon and text
- Top utility pill: rounded capsule with small score or value
- Tab group: subtle segmented control with soft active state
- Asset row: dark card with metadata on the right
- CTA button: warm rust or amber fill with strong contrast
- Upload button: clean accent action with rounded corners
- Credits badge: compact pill in the top-right, styled like the reference

No fancy effects. The interface should stay clean and direct. The mood comes from color, spacing, and contrast, not from excessive decoration.

## 6. DARK MODE PRIORITY
The dark mode should be the primary design. This is what the reference is doing. The warm brown palette looks strongest in a dark surface.

Dark mode should include:
- deep brown background
- medium warm-gray cards
- soft amber accent highlights
- ivory text for clarity
- subtle glow around active buttons or important panels

Light mode should exist as a comfortable alternative, but it should not feel like a different design system. It should just be a softer version of the same theme.

## 7. INTERACTION STYLE
The interface should feel premium but quiet.

- soft shadow on cards
- subtle hover lift
- minimal motion
- sharp focus states
- rounded actions with calm contrast

The product should not feel loud or playful. It should feel serious, useful, and polished.

## 8. PRODUCT-SPECIFIC DIRECTION
For this project, the core concept is a creator workspace with a freemium funnel.

The UI should support three moments clearly:
- free tool usage
- signup prompt before generation
- generation dashboard with credits and status

The top-right credit value should be a visual anchor. It should feel like a live product metric, not a decoration. The whole interface should make the user feel that the system is active, premium, and ready to create.

## 9. BROWSER PREVIEW LINKS
Local app preview:
- http://localhost:3000

Final mockup preview:
- https://claude.ai/code/artifact/02c7f139-ef8a-4984-8a82-e24d2e57c83a

Related docs:
- [PRD.md](../PRD.md)
- [docs/ARCHITECTURE-FE.md](ARCHITECTURE-FE.md)
- [docs/ARCHITECTURE-BE.md](ARCHITECTURE-BE.md)

This direction keeps the product close to the reference mood, while making it fit this project’s funnel, credit model, and workflow. The goal is a warm brown creator dashboard that feels premium and calm, not copied from any single external source.
