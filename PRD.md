# PRD — PromptDock  
*A Modular Prompt Building Desktop Tool*

**Author:** Julia Podlipensky  
**PRDVersion:** v1.2 
**Reference:** Concept proposal slides + PRD Co-Pilot

---

## Short Pitch
PromptDock is a local, cross-platform desktop application that enables students and non-developers to create, reuse, and assemble AI prompts using modular, human-readable building blocks.

Designed for speed, clarity, and everyday use, PromptDock is instantly accessible via a global keyboard shortcut and works with any AI tool through simple copy-to-clipboard output. It is local-first, private by default, and intentionally avoids “prompt engineering” complexity.

---

## 1) Core Context

### Problem
AI prompts are currently:
- scattered across notes, Word documents, Notion, Figma boards, and chat histories
- hard to retrieve quickly
- not modular or reusable by design

Observed in student work and discussions:
- effective prompts are reused via long searches through old chats
- new tasks still require rewriting prompts from scratch
- learning new prompting techniques increases fragmentation
- Reusing roles, styles, or output formats requires manual copy-paste from multiple sources

**Result**
- broken focus
- lost time
- inconsistent prompt quality
- frustration, especially for beginners

---

### Solution
PromptDock provides:
- a **central, local prompt library**
- **modular prompt blocks** (Role, Task, Context, Output, Style & Constraints)
- **instant access via global hotkey**
- **copy-to-clipboard output** usable in any AI tool

Prompts are built interactively from reusable “Lego-like” blocks, enabling:
- Faster prompt creation without starting from zero
- Consistent structure across different tasks
- Easy reuse, iteration, and experimentation

The tool is **local-first, private, and optimized for fast, daily workflows**.

---

### Target Users
- **Primary:** students in UX, web development, and creative coding courses  
- **Secondary:** non-developers experimenting with AI tools and prompting

---

### Primary Use Cases
- Quickly reuse a prompt that worked well before  
- Assemble a new prompt from reusable blocks  
- Save and organize prompting patterns learned in class  
- Switch between task contexts (e.g. Coding, Research, Writing)  
- Find prompts via fuzzy search instead of folder navigation  

---

### North-Star Metric

**Median time from hotkey press → prompt copied to clipboard**

(Success = reduced context-switching friction)

---

### Non-Goals (V1)
- AI-generated or AI-optimized prompts
- Cloud sync or team collaboration
- Browser extensions or web-only versions  
- Voice or vision-based input
- Advanced context capture (screen / computer vision)  

---

## 2) UX Foundations

### Experience Principles
- Speed over configuration
- Human-readable language (no “prompt engineering” jargon)
- **Guided tool**, not a developer dashboard
- Local and private by default

---

### Accessibility & Inclusion
- Clear visual hierarchy
- Plain language labels
- Readable contrast and spacing for daily use

---

### High-Level User Journey
1. User presses global keyboard shortcut  
2. Small overlay opens instantly at cursor position  
3. User sees:
   - Current task context  
   - Fuzzy search  
   - Favorites, recents, collections  
4. User selects an existing prompt or starts building one modularly  
5. Live preview updates in real time  
6. User copies prompt to clipboard  
7. User pastes prompt into AI tool of choice  

---

## 3) Scope & Priorities

### MVP Goals (V1)

**P0 Features**
- Global keyboard shortcut
- Overlay window (always-on-top)
- Prompt library (create, edit, delete)
- Modular prompt builder
- Fuzzy search across prompts and blocks 
- Favorites and recents
- Local-only storage
- One-click copy to clipboard


**P1 Enhancements**
- Prompt feedback (star rating or thumbs up)
- Filtering by:
  - style
  - topic
  - prompt technique
- Multiple library views (list / grouped)
- **Related Prompts & Derivations View**
  - Optional secondary view accessible from a prompt or template
  - Shows prompts **derived from the same template** or **sharing common blocks**
  - Indicates relationship type (e.g. *“derived from template”*, *“shares Actor + Output blocks”*)

---

### Out of Scope (V1)
- Cloud sync or multi-device support  
- Accounts or authentication  
- Voice-based prompt building  
- AI-assisted prompt improvement  
- Screen or computer-vision context capture 

---

### Assumptions & Risks
- Users operate on a single device in V1
- OS-level hotkeys are stable across macOS and Windows
- Performance expectations are high due to instant-access positioning  

---

## 4) Tech Overview

### Platform
- Desktop application
- Supported OS: macOS, Windows

---

### Frontend
- React

---

### Desktop Shell
- Electron
- Responsibilities:
  - window creation and overlay behavior
  - global hotkey registration
  - clipboard access
  - filesystem access

---

### State & Data
- **Zustand** — global UI and builder state
- **Zod** — schema validation and safe data evolution
- **Fuse.js** — fuzzy search across prompts and blocks
- Local JSON storage (SQLite considered post-V1) 
---

## 5) Data Model (Conceptual)

### Prompt
- `id`  
- `title`  
- `description`  
- `blocks[]` (ordered)  
- `tags` (style, topic, technique)  
- `rating` (optional)  
- `usageCount`  
- `createdAt`  
- `updatedAt`  

---

### Block
- `id`
- `type` (Role, Task, Context, Output, Style)
- `content`
- `variables` (optional)

---

### Collection
- `id`
- `name`
- `description`
- `promptIds[]`

---

## 6) Feature Modules

### Module 1 — Global Access Overlay (DONE)

**User Story**  
As a user, I want to open the prompt tool instantly via a hotkey, so I don’t break my workflow.

**Implementation Results**
- **Hotkey:** `Cmd/Ctrl+Shift+P` (Global toggle)
- **Background Persistence:** App stays in System Tray when "closed"; global hotkey always active.
- **System Tray:** Bauhaus-style logo with "Show" and "Quit" options.
- **Auto-Launch:** App starts automatically on system login.
- **Visuals:** 1200x800 frame, dark theme, centered overlay.
- **Control:** ESC, Hotkey, and Tray all control window visibility.

**Acceptance Criteria**
- [x] Global keyboard shortcut  
- [x] Overlay opens above all applications (Windows Top-Level)
- [x] Hotkey closes overlay  
- [x] System Tray support & Background mode
- [x] Auto-launch at login
- [x] No perceptible delay 

---

### Module 2 — Prompt Library & Search (DONE)

**User Story**  
As a user, I want to find prompts and blocks even if I don’t remember their exact name.

**Implementation Results**
- **Unified Library Grid:** Prompts and Blocks are rendered in a single, cohesive grid.
- **Search Functionality:** 
    - Implemented fuzzy search across titles, tags, and block content using `Fuse.js`.
    - **Category-Based Results:** Search results are organized into "Prompts" and "Blocks" categories.
    - **Dynamic Count Filtering:** Intelligent result headers that only show category counts when multiple types are present, or hide the count if only one category has matches to reduce visual clutter.
- **Role-Based Ranking:** Integrated a global "Role" system (Coding, Research, etc.) that dynamically reorders search results and library items based on relevance to the active role.
- **Role Selector:** Inline role switching in the library for instant context updates.
- **Interactive Block Cards:** Blocks are scrollable/selectable (read-only) with transient action overlays (Fade-in on hover, no blur).
- **Tab Refinements:** Modernized library navigation (All, Favorites, Recents, Collections) with underline indicators and premium alignment.
- **Persistent Data:** Full local storage support for custom roles and search/rank logic.

**Acceptance Criteria**
- [x] Fuzzy search across titles, tags, and block content for faster access 
- [x] Views for:
  - [x] Favorites  
  - [x] Recents  
  - [x] Collections  
- [x] (Adjusted) Automatic role-based context filtering (Style, topic, technique integrated into Role logic)

---

### Module 3 — Modular Prompt Builder (DONE)

**User Story**  
As a user, I want to build prompts from reusable blocks instead of starting from scratch.

**Implementation Results**
- **Split-Pane Interface:** 
    - **Sidebar:** Categorized library of reusable blocks (Role, Task, Context, etc.) searchable and draggable.
    - **Canvas:** Central area for assembling and editing blocks.
    - **Preview:** Live, real-time concatenation of block content.
- **Block Interaction:**
    - **Drag-and-Drop:** Intuitive drag-and-drop from library to canvas, and reordering within the canvas.
    - **Manual Reordering:** Directional arrow buttons for precise block placement.
    - **Inline Editing:** Auto-expanding textareas for direct content manipulation within blocks.
    - **Block Persistence:** Capability to edit blocks with options to overwrite the original or save as a new copy.
    - **Custom Creation:** "Quick Add" toast overlay for creating new blocks on the fly with category-specific guidance.
- **Prompt Management:**
    - **Full Save Workflow:** "Save" and "Save As" functionality with metadata (Title, Description, Tags).
    - **Tagging System:** Pill-style tag inputs for easy organization.
    - **Dirty State:** Visual indicators and prompts for unsaved changes to prevent data loss.
- **Output:**
    - **One-Click Copy:** Dedicated button with "Copied!" visual feedback.
    - **Live Preview:** Scrollable, read-only view of the final compiled prompt.
- **UI Refinements:**
    - Collapsible sidebars for focused writing.
    - Consistent styling with library views (buttons, icons, typography).

**Acceptance Criteria**
- [x] Block-based editor with clear section headings
- [x] Blocks can be added, removed, edited
- [x] Reordering via drag & drop and buttons
- [x] Live preview of full prompt
- [x] One-click “Copy to Clipboard”
- [x] Saving functionality for prompts & prompt blocks

---

### Module 4 — Feedback & Reuse Signals (P1)

**User Story**  
As a user, I want to mark prompts and prompt blocks that worked well so I can easily reuse them.

**Acceptance Criteria**
- Star or thumbs-up rating for prompts & blocks (mark as favorites)  
- Filter and sort by rating & usage count  
- Usage count tracked per prompt & block (how often was it copied from the prompt builder to clipboard)


---

### Module 5 — Prompt Relationships (Concept / P2)

**User Story**  
As a learner, I want to understand how prompts are derived or related.

**Concept**
- Graph or visual view:
  - templates → derived prompts
  - shared blocks between prompts
- Not included in V1

---

## 7) Information Architecture & Navigation

### Main Views
- Overlay Home (search, favorites, recents, collections)
- Prompt Builder
- Prompt Library
- Settings

---

### Navigation Model
- Hotkey-first entry point  
- Search as primary interaction  
- Context (role / task) influences results  
- Builder opens inline without full navigation jumps  

---

## 8) Quality & Testing

### Functional Testing
- Global hotkey reliability across applications  
- Clipboard copy success rate  
- Search performance and accuracy  
- Prompt persistence across restarts  

---

### UX Testing
- First-time user clarity
- Time-to-copy measurement

---

## 9) Launch & Delivery

### Distribution
- Local installers for macOS and Windows

---

### Maintenance
- Local schema migrations via Zod
- JSON export/import for prompt libraries


