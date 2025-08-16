Got it—this is for the **product** (your users), not our internal stack. Here’s a calm, tight plan you can ship in phases.

# App IA (what users see)

* Navbar modes: **Canvas** • **Design** • **Language (FraC)** • **Backend**
* Right sidebar shows **only** in Canvas/Design. Backend uses a VSCode-style inspector instead.
* Left “text sidebar” mimics VSCode (Explorer), with a toggleable compact width.

# Left Sidebar (VSCode-style Explorer)

* Canvas/Design:

  * Tools
  * Layers
  * Components & Assets
  * Styles/Tokens
* Language (FraC):

  * Frameworks (React, Angular, Vue, …)
  * **Slidebar compilers**: FracRecT (React), FracACT (Angular), FraVeCT (Vue), FraSVC (Svelte), FraSOL (Solid)
  * Project structure (pages/components/services)
* Backend (user-built backend):

  * Services
  * Endpoints (REST/RPC/GraphQL)
  * Models/Schemas
  * Database & Migrations
  * Jobs & Queues
  * Webhooks
  * Secrets/Envs
  * Policies
  * Integrations

# Right Sidebar (visible in Canvas/Design only)

* Properties (selection info, geometry, appearance, text/image props)
* Actions & Logic (event bindings, rule list, “Open in Logic Graph”)
* History (undo/redo)
* Canvas settings (when nothing selected)

# Center Area by Mode

* Canvas: Canvas board + Logic Graph tab
* Design: Component/variant editor
* Language (FraC): Code/DSL editor + Compiler diagnostics + Preview + “Publish to Canvas”
* Backend: Endpoint designer (visual + code), Modeler, Playground, Logs

# Language (FraC) specifics

* Users choose a framework and write/import code.
* Selected compiler (FracRecT/FracACT/FraVeCT/…) builds to a **canonical UI model** (nodes, styles, events).
* “Publish to Canvas” materializes the model as canvas objects and logic hooks.
* Keep a slide-in **Compiler Panel**: framework picker, errors, perf notes.

# Backend (for your users)

* Goal: Users design **their own** backend inside your app.
* No-code → low-code:

  * Models (form or schema text)
  * CRUD generators
  * Custom endpoints (TS handler editor)
  * Jobs (cron)
  * Queues & workers
  * Webhooks
  * Policies (RBAC/ABAC)
  * Caching/Rate limit
* Runtimes (exporters):

  * Serverless bundles (Workers/Vercel)
  * Dockerfile (container)
  * Local dev server
* Playground: test requests, view logs, see auto cURL/SDK snippets.

# State & Sync (keep simple)

* **yjs**: shared doc for canvas objects, logic graph, design tokens, backend specs.
* **zustand**: local UI state (selection, open panels, zoom, editor tabs).
* Transactions: wrap multi-field edits in `Y.transact`.
* Undo/redo: yjs `UndoManager` on canvas/graph/backend maps.

# MVP slices to build (order)

1. **Canvas mode**: Tools, Layers, Properties, Actions & Logic (one rule: OnClick→SetFill).
2. **Right sidebar gating**: only in Canvas/Design.
3. **Language mode (FracRecT first)**: edit TSX → compile to canonical model → Publish to Canvas.
4. **Backend mode (core)**:

   * Models (define), **Generate CRUD** (REST), Endpoint playground.
   * Local dev execution (Node sandbox) with logs panel.
5. **Export**: Download serverless bundle + Dockerfile.
6. **Explorer polish**: VSCode feel, keyboard nav, search.

# Minimal data model (shared)

* `yCanvas`: `{ [id]: { type, x, y, w, h, rotation, props, logicRefs?[] } }`
* `yGraph`: `{ nodes:[], edges:[] }`
* `yDesign`: `{ tokens:{colors,typography,spacing}, components:[] }`
* `yBackend`: `{ models:[], endpoints:[], jobs:[], queues:[], policies:[], envs:[] }`
* zustand (local): `{ mode, selection[], zoom, openPanels, editorTabs }`

# UX rules to lock in

* Mode-aware UI (right sidebar hidden outside Canvas/Design).
* Properties panel is **contextual** to selection; disabled states when none.
* Compiler slidebar remembers last framework per project.
* Backend editor tabs behave like VSCode (dirty indicators, split view, bottom console).

If you want, I can extend your current demo with:

* The VSCode-style **left Explorer** and **mode routing**,
* A basic **Right Properties** panel (Canvas/Design only), and
* A stubbed **Backend** mode (Models → Generate CRUD → Playground) wired to shared state.
