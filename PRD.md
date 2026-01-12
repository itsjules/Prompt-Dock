# PRD — PromptDock  
*A Modular Prompt Building Desktop Tool*

**Author:** Julia Podlipensky  
**PRDVersion:** v1.0 
**Reference:** Concept proposal slides 

---

## Short Pitch
PromptDock is a **local, cross-platform desktop application** that allows students to **create, reuse, and assemble AI prompts** through modular building blocks.  
It is designed for **speed, clarity, and everyday usability**, especially for non-developers, and is accessible instantly via a **global keyboard shortcut**.

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

**Result**
- broken focus
- lost time
- inconsistent prompt quality
- frustration, especially for beginners

---

### Solution
PromptDock provides:
- a **central, local prompt library**
- **modular prompt blocks** (Role, Task, Context, Output, Style)
- **instant access via global hotkey**
- **copy-to-clipboard output** usable in any AI tool

The tool is local-first, private, and optimized for fast daily use.

---

### Target Users
- **Primary:** students in UX, web development, and creative coding courses  
- **Secondary:** non-developers experimenting with AI tools and prompting

---

### Primary Use Cases
- Quickly reuse a successful prompt
- Build a new prompt from reusable blocks
- Save and tag new prompting techniques learned in class
- Switch between task contexts (e.g. Coding, Writing, Research)
- Find prompts via fuzzy search instead of folder navigation

---

### Non-Goals (V1)
- AI-generated or AI-optimized prompts
- Cloud sync or team collaboration
- Browser-only implementation
- Voice or vision-based input

---

## 2) UX Foundations

### Experience Principles
- Speed over configuration
- Human-readable language (no “prompt engineering” jargon)
- Local and private by default

---

### Accessibility & Inclusion
- Clear visual hierarchy
- Plain language labels
- Readable contrast and spacing for daily use

---

### High-Level User Journey
1. User presses global hotkey  
2. Overlay opens instantly  
3. User searches or browses prompts/blocks  
4. Prompt is assembled or selected  
5. Prompt is copied to clipboard  
6. User pastes into AI tool of choice  

---

## 3) Scope & Priorities

### MVP Goals (V1)

**P0 Features**
- Global keyboard shortcut
- Overlay window (always-on-top)
- Prompt library (create, edit, delete)
- Modular prompt builder
- Fuzzy search
- Favorites and recents
- Local-only storage
- Copy-to-clipboard

**P1 Enhancements**
- Prompt feedback (star rating or thumbs up)
- Filtering by:
  - style
  - topic
  - prompt technique
- Multiple library views (list / grouped)

---

### Out of Scope (V1)
- Screen or computer-vision context capture
- Voice input
- Cloud sync or multi-device support
- Authentication or accounts

---

### Assumptions & Risks
- Users operate on a single device in V1
- Prompt libraries remain small to medium sized
- OS-level hotkeys are stable across macOS and Windows

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
- **Tauri (preferred)** or Electron (alternative)
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
- Local JSON storage (optional SQLite later)

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

### Module 1 — Global Access Overlay (P0)

**User Story**  
As a user, I want to open the prompt tool instantly via a hotkey, so I don’t break my workflow.

**Acceptance Criteria**
- Configurable global keyboard shortcut
- Overlay opens above all applications
- ESC closes overlay
- No visible delay

---

### Module 2 — Prompt Library & Search (P0)

**User Story**  
As a user, I want to find prompts even if I don’t remember their exact name.

**Acceptance Criteria**
- Fuzzy search across titles, tags, and block content
- Additional Containers of blocks by recent, favorites, collections
- Filters by style, topic, technique

---

### Module 3 — Modular Prompt Builder (P0)

**User Story**  
As a user, I want to build prompts from reusable blocks instead of starting from scratch.

**Acceptance Criteria**
- Block-based editor with clear section headings
- Blocks can be added, removed, edited
- Reordering via drag & drop and buttons
- Live preview of full prompt
- One-click “Copy to Clipboard”

---

### Module 4 — Feedback & Reuse Signals (P1)

**User Story**  
As a user, I want to mark prompts that worked well so I can find them again.

**Acceptance Criteria**
- Star or thumbs-up rating
- Search/filter by rating
- Usage count tracked per prompt

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
- Overlay Home (search, favorites, recents)
- Prompt Builder
- Prompt Library
- Settings

---

### Navigation Model
- Hotkey opens overlay
- Search-first interaction
- Role/task context filters results
- Builder opens inline

---

## 8) Quality & Testing

### Functional Testing
- Hotkey works across applications
- Clipboard copy reliability
- Search accuracy and speed
- Prompt persistence across restarts

---

### UX Testing
- Keyboard-only flow
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


