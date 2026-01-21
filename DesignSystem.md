Design System: Futuristic Bauhaus (PromptDock v2)
1. Design Essence: "Structured Fluidity"
The core essence of the reference material ("Curve Study") is the dynamic tension between rigid geometry (Bauhaus structure) and organic motion (Fluid curves).

For PromptDock, this translates to a tool that feels less like a "compiler" and more like a digital artboard. The interface should feel:

Confidence: Large, high-contrast typography and bold colors.
Creativity: Breaking the grid with organic shapes and asymmetric layouts.
Clarity: Excessive whitespace to reduce cognitive load.
The Shift:

From: "Dark, Technical, Terminal-like"
To: "Bright, Tactile, Studio-like"
2. Visual Language
2.1 Color Palette: "Kinetic & Calm"
We move from the generic dark mode to a high-contrast, gallery-inspired palette.

Primary Colors
Canvas (Background): #F9F9F9 (Warm Alabaster) - Replaces #1a1b1e
Why: Creates a "paper" feel that invites creation rather than consumption.
Ink (Text/Borders): #121212 (Soft Black) - Replaces #e0e0e0
Why: Maximum contrast for readability; classic Bauhaus print aesthetic.
Accent Colors (The "Curve Study" Triad)
Kinetic Orange: #FF5722
Role: Primary Actions (Save, Copy), Toggle Heads, "Active" States.
Electric Blue: #2979FF
Role: Selection, Focus Rings, Links.
Soft Purple: #D1C4E9
Role: Secondary Backgrounds, "Favorite" highlights, Soft containers.
Mint/Teal: #009688
Role: Success states, "Role" tags.
2.2 Typography
We separate "Structure" (Headlines) from "Content" (Body).

Headings: Space Grotesque (or Syne / Bricolage Grotesque)
Usage: Page Titles, Section Headers, distinct "Labels".
Style: Bold (700), Tight Tracking (-0.5px), often ALL CAPS for small labels.
Body: Inter (Existing) or DM Sans
Usage: Prompt content, inputs, settings.
Style: Regular (400), taller line-height (1.6) for readability.
2.3 Shapes & Geometry
The "Super-Curve": Mix of sharp corners and full-semicircles (pill shapes).
Example: A card might have top-left and top-right squared, but bottom-left and bottom-right fully rounded (20px).
Depth: move from "Border only" to "Deep Shadow / Pop".
Style: Solid offsets (box-shadow: 4px 4px 0px #000) or soft diffuse glows for selected items.
3. UI Concept & Evolution
3.1 Global Layout (The Shell)
Current: Top Bar + Content Area (Standard App). New: "The Frame" Layout.

The app window has a visible "frame" (padding) around the content.
Navigation: Floating pill or side-docked "Toolbar" (like Photoshop/Figma) rather than a top navigation bar.
Background: Subtle abstract geometric shapes (large circles/waves) fixed in the background (using SVG) to give depth without distraction.
3.2 Key Screens
A. The Library (Home)
Remove: The standard 3-column grid of "cards".
New Concept: "The Gallery Wall".
Masonry or Asymmetric Grid: Items flow naturally.
Cards: White cards on the off-white background. No borders, just soft shadow or single-edge accent color.
Typography: Prompts used as Art. The Title is huge. Tags are pills.
Interaction: Hovering a card makes it "lift" (scale + shadow) and reveals the "Copy" action prominently in Kinetic Orange.
B. The Prompt Canvas (Builder)
Remove: The strict split-pane "sidebar vs main".
New Concept: "The Workbench".
Canvas: The writing area is central and "floating" (like a sheet of paper).
Blocks: Instead of a list, they are "Tools" in a palette.
Dragging: When you drag a block, it feels physically heavy (visual feedback).
Assembled Prompt: Looks like a continuous document. The "blocks" merge visually into a single flow, separated by subtle "connectors" or whitespace, not heavy boxes.
C. Block Construction
Remove: Heavy borders around every input.
Simplify: Inputs look like simple text lines (underscored or transparent bg) until focused.
Expressive:
Role Block: Is a circle/avatar shape.
Action Block: Is a directional shape (arrow-like container).
Context Block: Is a brackets/parentheses style container.
3.3 Headers & Navigation
Headers: Massive. font-size: 3rem.
Dividers: Thick, confident black lines (2px or 3px) with geometric end-caps (circles or squares).
4. Experience & Interaction
Motion: Nothing appears instantly. It slides, fades, or expands.
Opening the app: The window "unfolds".
Searching: Results filter with a stagger effect.
Micro-interactions:
Clicking a button gives a satisfying "press" (scale down).