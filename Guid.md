# Acerox (Accreox) — AI Web Builder MVP Spec

## 0) One‑liner

An AI‑assisted, Figma‑style web builder with a drag‑drop canvas, an asset library, and a logic layer that compiles user intents and multi‑framework snippets into deployable HTML/CSS/JS and Web Components.

---

## 1) Core User Flows (MVP)

* **Create project** → pick template or blank → enters editor.
* **Prompt AI**: “Create a primary button” → component appears on canvas → editable props in right panel → saved into **Assets**.
* **Drag from Assets** onto canvas → position, resize, snap to grid.
* **Style**: select component → change typography, color, spacing, state variants.
* **Logic**: open Logic tab → connect component events (onClick, onSubmit) to API calls or code blocks → preview result.
* **Preview & Publish**: live preview updates; publish to Acerox Hosting (static + serverless) or export ZIP.

---

## 2) Editor UI (3-pane)

* **Left**: Assets & Layers

  * Asset categories: Components, Sections, Pages, Icons, Images, Data Models, APIs.
  * Search, tags, favorites; drag from here to canvas.
* **Center**: Infinite Canvas

  * Zoom/pan, rulers, guides, smart snapping, alignment, multi-select, group/ungroup, lock, hide.
  * Frames = pages; responsive breakpoints (desktop/tablet/mobile) with per-breakpoint overrides.
* **Right**: Inspector

  * **Design**: layout (flex/grid), spacing, size, typography, colors, effects, radius, variants, states (default/hover/pressed/disabled).
  * **Data/Logic**: props, bindings, event handlers, API connectors, state signals, validations.

---

## 3) AI Capabilities (Phase 1)

* **Generate Components from Prompt**

  * Input: natural language + design tone (e.g., “modern, glassmorphism”).
  * Output: component spec (JSON IR) + styles + accessibility hints.
* **Refine Styles**: “Make it more vibrant” → modifies tokens/variants.
* **Wire Data**: “Bind this list to /api/products and paginate by 12.”
* **Explain/Repair**: “Why is my form not submitting?” → traces event chain; suggests fix.

**Model IO (high-level)**

```json
{
  "intent": "create_component",
  "prompt": "Primary button with icon, rounded, gradient",
  "brand_tokens": {"primary": "#5B7CFF"},
  "a11y": true
}
```

Model returns a **Component IR** (see §7) + optional images/icons.

---

## 4) Tech Stack (recommendation)

* **Frontend**: Next.js (App Router) + React 18; TailwindCSS; shadcn/ui; Framer Motion.
* **Canvas**: Konva.js (React-Konva) or Fabric.js for vector/object manipulation; optional WebGL via Pixi for perf.
* **Code Editing**: Monaco Editor; JSON Schema for IR.
* **Logic Graph**: React Flow for node‑based logic & data bindings.
* **Real‑time Collab**: Yjs CRDT + y-webrtc (peer) with fallback y-websocket; awareness cursors.
* **Icons & Images**: Lucide; upload to object storage (S3/Supabase Storage).
* **Backend**:

  * Edge functions (Vercel/Cloudflare) for AI routing & compile.
  * Postgres (Supabase) for projects, assets, versions, collaborators.
  * Redis (Upstash) for sessions, presence, job queues.
* **Auth**: Supabase Auth or Clerk; orgs/workspaces, roles (Owner, Editor, Viewer).
* **Deploy/Preview**: Static export with serverless functions; CDN caching.

---

## 5) Architecture Overview

1. **Editor App** maintains a canonical **Project State** (CRDT) shared live.
2. **AI Orchestrator** turns prompts into **Component IR** or **Logic IR**.
3. **Compiler** turns IR → runtime artifacts:

   * **Web Components** (Custom Elements) wrapping generated markup/logic → framework‑agnostic runtime.
   * CSS variables from **Design Tokens**.
   * Optional SSR/CSR Next.js page scaffolds.
4. **Runtime** renders pages from saved IR + data bindings; deployable as static + JS.

Why Web Components: single artifact works in React, Vue, Angular; isolates styles; easier embedding. User code in any framework can be compiled/transpiled and wrapped into a Custom Element boundary.

---

## 6) Data Model (first pass)

* **users**(id, name, email, avatar\_url, created\_at)
* **orgs**(id, name, plan, created\_at)
* **org\_members**(org\_id, user\_id, role)
* **projects**(id, org\_id, name, slug, brand\_tokens JSONB, created\_at)
* **project\_collaborators**(project\_id, user\_id, role)
* **assets**(id, project\_id, type, name, ir JSONB, thumbnail\_url, version, created\_at)
* **pages**(id, project\_id, name, path, ir JSONB, created\_at)
* **logic\_flows**(id, project\_id, page\_id, graph JSONB)
* **apis**(id, project\_id, name, base\_url, auth JSONB, schemas JSONB)
* **versions**(id, project\_id, snapshot JSONB, created\_at, label)

---

## 7) IRs (Intermediate Representations)

### 7.1 Component IR (simplified)

```json
{
  "id": "btn_123",
  "type": "component",
  "element": "button",
  "props": {"text": "Button", "icon": "plus"},
  "style": {"variant": "primary", "size": "md", "radius": 12},
  "layout": {"display": "inline-flex", "gap": 8, "padding": [10,16]},
  "a11y": {"ariaLabel": "Primary action"},
  "states": {"hover": {...}, "pressed": {...}},
  "slots": [{"name": "leftIcon"}, {"name": "content"}],
  "bindings": {}
}
```

### 7.2 Page IR

```json
{
  "id": "page_home",
  "frame": {"w": 1440, "h": 4000, "breakpoints": [1440, 1024, 768, 375]},
  "children": [ /* Component IRs with absolute/auto layout */ ]
}
```

### 7.3 Logic IR (node graph)

```json
{
  "nodes": [
    {"id": "evt_click", "type": "Event", "on": "btn_123.click"},
    {"id": "http_1", "type": "HTTP", "method": "POST", "url": "/api/login"},
    {"id": "bind_1", "type": "Bind", "target": "form.error"}
  ],
  "edges": [
    {"from": "evt_click", "to": "http_1"},
    {"from": "http_1.error", "to": "bind_1"}
  ]
}
```

---

## 8) Logic & API Layer

* **Connectors**: REST (fetch), GraphQL, Webhook triggers, Supabase, Firebase.
* **Auth**: API keys, OAuth2, JWT; secrets stored per project.
* **Validation**: Zod/JSON Schema for inputs/outputs with UI forms auto‑generated.
* **State**: signal store (Zustand/Jotai) bound to components via bindings.

---

## 9) Compilation Strategy

* **Design Tokens → CSS Variables** at \:root and component scope.
* **Component IR → Web Component** with Shadow DOM and props/events mapped from IR.
* **Logic IR → runtime graph** (topologically executed) with async nodes and error channels.
* **Cross‑framework code**: transpile TS/JS → ES modules; optional wrappers for React/Vue/Angular that mount the Web Component.
* **Export**:

  * Static site (HTML + JS bundle + assets),
  * NPM package of components (optional),
  * ZIP download.

---

## 10) Collaboration & Versioning

* **Live cursors**, selection highlights, comment pins on canvas.
* **Branching**: create branch from version; PR‑style review; merge with diff of IR.
* **Audit log** of mutations (who changed what).

---

## 11) Performance & A11y

* Virtualize canvas layers; bitmap caching for heavy groups.
* Precompute hit regions; lazy load assets.
* Enforce color contrast; tab order; ARIA from IR; auto‑generate focus rings.

---

## 12) Security

* Row‑level security per org/project.
* Secret vault for API creds; scoped tokens for previews.
* iFrame/Web Worker sandboxes for executing user logic safely.

---

## 13) Pricing & Plans (placeholder)

* Free: 1 project, limited assets, community domain.
* Pro: unlimited projects, custom domain, team collab, AI credits.
* Enterprise: SSO, audit, private models, VPC peering.

---

## 14) Milestones (8–10 week MVP)

**Week 1–2**: Project scaffolding, auth, base data models, asset panel, brand tokens.

**Week 3–4**: Canvas (Konva/Fabric) with drag/resize/snap; Inspector (layout/typography/colors); basic component primitives (Button, Card, Input, List, Navbar, Hero).

**Week 5**: Logic graph (React Flow), HTTP connector, state bindings, live preview.

**Week 6**: AI v0 (prompt → Component IR), style refine, asset save; thumbnails.

**Week 7**: Compiler v0 (IR → Web Components + CSS vars); export preview build.

**Week 8**: Collab (Yjs), comments, publish to Acerox Hosting; QA & a11y pass.

---

## 15) Immediate Next Actions (Day 1–3)

1. Finalize IR JSON Schemas and TypeScript types.
2. Spin up Supabase project; create tables in §6.
3. Scaffold Next.js app with Tailwind + shadcn; integrate React-Konva and React Flow.
4. Implement Asset panel with drag‑drop to canvas; persist IR per drop.
5. Add AI endpoint stubs (`/api/ai/generate`, `/api/ai/refine`) returning mocked IR for now.

---

## 16) Stretch Ideas (post‑MVP)

* **Design to Code Import**: Figma plugin → Acerox IR.
* **Auto‑layout → CSS Grid/Flex translator**.
* **Theme Mixer**: upload brand palette/logo → generate tokens & variants.
* **Data CMS**: simple collections/tables with inline editing.
* **Marketplace**: sell/buy components and sections.

---

## 17) Risks & Mitigations

* **Multi‑framework code ingestion** is complex → prefer Web Components as the universal runtime; compile wrappers later.
* **Canvas performance** with many nodes → virtualization + layer caching.
* **AI hallucinations** → constrain with JSON Schema; validate IR before commit; human‑approved changes.

---

## 18) Definition of Done (MVP)

* Users can: prompt → get component → drag to canvas → style → bind to API → preview → publish.
* Real‑time collab for 2+ users works reliably.
* Exported site passes Lighthouse ≥ 90 (perf/accessibility/best practices/SEO) on a sample page.

#
