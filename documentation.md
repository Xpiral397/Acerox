# Acerox IR — Axer Namespace (axer.vsl / axer.vbl / axer.asl / axer.backend)

> **Canonical rule:** Everything lives under the **`axer`** namespace. Visual, behavior, semantic, and backend graphs are **`axer.vsl`**, **`axer.vbl`**, **`axer.asl`**, and **`axer.backend`** respectively. Legacy names (**ASG/ABG/ATG**) are accepted as **aliases at load time only** and normalized into `axer.*`. Persisted documents should always use `axer.*`.

---

## 0) Purpose

Define a future‑proof, AI‑friendly Intermediate Representation that can describe any interactive system (2D/3D UI, logic/behavior, semantic domain, and backend). The IR compiles to HTML/CSS/JS/Web Components, WebGL/WebGPU renderers, and serverless backends.

---

## 1) Envelope & Aliases

```jsonc
{
  "schemaVersion": "1.x.y",
  "id": "proj_*",
  "createdAt": "ISO",
  "modifiedAt": "ISO",
  "project": { "name": "", "slug": "", "orgId": null, "tags": [] },
  "locales": { "default": "en", "supported": [] },
  "units": { "length": "px", "angle": "deg", "time": "ms", "colorSpace": "srgb" },
  "registryRefs": { "types": ["@acx/base"], "actions": [], "icons": [] },
  "axer": {
    "vsl": { /* Visual Structure & Layout */ },
    "vbl": { /* Visual Behavior & Logic  */ },
    "asl": { /* Application Semantic Layer */ },
    "backend": { /* Resources/Functions/Jobs/Workflows */ }
  },
  "adapters": { "dom": {}, "2d": {}, "3d": {} },
  "profiles": { "export": [], "runtime": {} },
  "provenance": { "commits": [], "signatures": [] },
  "extensions": {}
}
```

**Aliases accepted at load:**

* `asg` → `axer.vsl`
* `abg` → `axer.vbl`
* `atg` → `axer.backend`

**Conflict rule:** If both legacy and canonical are present, **canonical wins**; loader logs a warning and drops legacy.

---

## 2) axer.vsl — Visual Structure & Layout

### 2.1 Design tokens

```jsonc
axer.vsl.tokens = {
  color: { /* brand, surface, text, states, roles */ },
  typography: {
    fonts: { sans: "", mono: "" },
    sizes: { /* xs..7xl */ },
    weights: { /* regular, medium, semibold... */ },
    lineHeights: { /* tight, normal, loose... */ }
  },
  spacing: { /* 0..n */ },
  radii: { /* sm, md, lg... */ },
  shadows: { /* sm, md, lg... */ },
  borders: { widths: { /* hairline.. */ } },
  motion: { durations: {}, easings: {} },
  breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 },
  elevation: { /* layer depths */ },
  z: { base: 0, overlay: 40, modal: 50, toast: 60 },
  focus: { ring: { width: 2, color: "#5b7cff" } }
}
```

### 2.2 Assets

* `files[]`, `fonts[]`, `images[]`, `icons[]`, `videos[]`, `audio[]`, `meshes[]`, `materials[]`.

### 2.3 Guides & responsive

* `guides.grid { columns, gutter, maxWidth }`, `rulers`, `snap { enabled, toGrid, toGuides }`.
* `responsiveProps` (per‑component overridables): `visibleAt[]`, `gridCols{}`.
* `variants { ComponentType → { default, outline, ghost, states{ hover, active, disabled, focus{ ring }}} }`.

### 2.4 Component registry (`componentTypes[]`)

Each item defines a reusable component **type** and its prop schema. Examples:

* UI: `Text`, `Container`, `Divider`, `Spacer`, `Tooltip`, `Popover`, `Button`, `SearchInput`, `NavItem`, `Card`, `List`, `Table`, `Toolbar`, `Tabs`, `View`, `KPIGrid`, `Sparkline`, `Panel`, `Form`, `AvatarMenu`, `Modal`, `ModalActions`, `Kanban`.
* Low‑level: `ExportHints`, `A11y`, `Binding`, `Interaction`, `Layout2D`, `Grid`, `Transform`, `TextSpan`, `Image`.
* 3D: `Mesh3D`, `Material`, `Light`, `Camera`.

> The registry enables AI to generate consistent components and lets the compiler enforce prop types.

### 2.5 Entities (scene graph)

Entity shape:

```jsonc
{
  id: "e_*",
  name: "",
  parentId: null,
  children: [],
  tags: [],
  visible: true,
  locked: false,
  order: 0,
  components: [ { type: "*", props: { /* Value */ } } ],
  overrides: {},
  metadata: {}
}
```

### 2.6 Values (the **Value** union for props)

* **Atom** `{ kind: "atom", type: "number|string|bool|color|vec2|vec3|quat|token", value, unit?, space? }`
* **Formula** `{ kind: "formula", expr: { op, args|left/right }, inputs: ["axer.vbl/state/*", "axer.asl/*"], memo? }`
* **Ref** `{ kind: "ref", ref: "json-pointer", fallback? }`
* **SignalRef** `{ kind: "signal", key: "axer.vbl/state/...", initial? }`
* **Array/Object/Literal** (native JSON)

### 2.7 2D/3D world

* `world { space, upAxis, unitsPerMeter, environment.ibl }`
* `lighting { ambient, directional[], point[], spot[] }`
* `cameraRig { mode, controls{ orbit, pan, zoom } }`

### 2.8 A11y & export hints

* `A11y { role, name, tabIndex, aria{} }`, `ExportHints { tag, role?, variant? }`.

### 2.9 Performance hooks

* Virtualization hints, bitmap caching flags, layer isolation, `z` tokens.

---

## 3) axer.vbl — Visual Behavior & Logic

### 3.1 State

`state.signals[]` → `{ key, type, initial? }` (keys are hierarchical: `ui/theme`, `data/kpis`, `route/path`).

### 3.2 Nodes & ports

Node shape:

```jsonc
{ id: "n_*", type: "Event.*|State.Signal<T>|Compute.*|Data.*|Effect.*", label?: "", params?: {}, in: [Port], out: [Port], traits?: { purity, idempotent, retry, timeoutMs, cache } }
```

Port shape: `{ id, valueType, role: "data|control", default?, variadic? }`.

### 3.3 Edges, entrypoints, CFG

* `edges[] { from{node,port}, to{node,port}, kind: data|control, when?, priority? }`
* `entrypoints[] { event: "e_id.onClick|keyboard.Ctrl+K|page.onLoad", target{node,port} }`
* CFG is derived from control edges; used for validation and tests.

### 3.4 Effects & compute (common node kinds)

* `Event.OnLoad`, `Event.OnShortcut`, `Event.OnRouteChange`
* `State.Signal<T>` (get/set), `State.Store` (persistent)
* `Compute.Map/Filter/Reduce/Ternary/Not/Eq`
* `Data.HTTP`, `Data.Cache`, `Data.GraphQL`
* `Effect.Navigate`, `Effect.Toast`, `Effect.ModalOpen/Close`, `Effect.SetDomAttr`, `Effect.StorageGet/Set`
* `Compute.Wasm` (AssemblyScript-friendly) `{ module, fn }`

---

## 4) axer.asl — Application Semantic Layer

A domain graph describing **entities, fields, relations, validations, permissions, and queries** that UI binds to. It is optional but recommended for complex apps and AI tooling.

### 4.1 Schema

```jsonc
axer.asl = {
  models: [
    { id: "m_user", name: "User", fields: [ { id: "f_id", name: "id", type: "string", primary: true }, { id: "f_name", name: "name", type: "string" } ], indexes: [], permissions: { /* RBAC/ABAC */ } }
  ],
  relations: [ { from: "User", to: "Project", kind: "one-to-many", via: "ownerId" } ],
  queries: [ { id: "q_activeProjects", source: "Project", where: { status: "Active" }, select: ["id","name","owner"] } ],
  validations: [ { id: "v_projectName", rule: "len(name) > 2", severity: "error" } ]
}
```

### 4.2 View‑models & bindings

* `viewModels[]` map ASL models/queries to VSL components (`Form`, `Table`, etc.).
* `Binding` values in VSL may reference `axer.asl.*` for strong typing and auto‑forms.

---

## 5) axer.backend — Resources / Functions / Jobs / Workflows / Policies

Matches prior ATG with richer metadata.

* **resources\[]** `{ id, type: DB|Table|Index|Queue|Topic|Bucket|KV|Cache|Search|Endpoint|Schedule|Webhook, config{} }`
* **functions\[]** `{ id, name, inputs{}, outputs{}, effects[], codeRef{ module, export?, wasm?, runtime? }, env?, bindings? }`
* **jobs\[]** `{ id, trigger{ type: schedule|message|http|webhook, cron?, topic?, method?, path?, provider? }, handler, idempotencyKey?, retry? }`
* **workflows\[]** `{ id, steps[], edges[], compensations[]? }`
* **policies\[]** `{ subject, can[], on[] }`
* **connectors/secrets/deploy/observability/budgets** as needed.

**UI links:** VBL `Data.HTTP` nodes target `axer.backend` endpoints; outputs feed signals/bindings.

---

## 6) Normalization, Validation, Versioning

* Loader normalizes aliases (`asg→axer.vsl`, `abg→axer.vbl`, `atg→axer.backend`).
* Unknown fields go under `extensions.*`.
* JSON Schemas: `schemas/vsl.schema.json`, `schemas/vbl.schema.json`, `schemas/asl.schema.json`, `schemas/backend.schema.json`, and `schemas/document.schema.json`.
* Semver upgrades: minor adds keys; major may deprecate aliases.
* Provenance keeps patches (JSON Patch with meta).

---

## 7) End‑to‑end example (minimal, illustrative)

```jsonc
{
  "axer": {
    "vsl": {
      "tokens": { "typography": { "fonts": { "sans": "Inter" } } },
      "entities": [
        { "id": "e_btn", "name": "Buy", "components": [
          { "type": "Button", "props": { "label": "Buy now" } },
          { "type": "Interaction", "props": { "onClick": { "ref": "axer.vbl/nodes/pay" } } }
        ]}
      ]
    },
    "vbl": {
      "nodes": [
        { "id": "pay", "type": "Data.HTTP", "params": { "method": "POST", "url": "/api/checkout" },
          "in": [{"id":"in","valueType":"void","role":"control"}],
          "out": [{"id":"ok","valueType":"json","role":"data"}] },
        { "id": "toast_ok", "type": "Effect.Toast", "params": { "type": "success", "title": "Paid" },
          "in": [{"id":"in","valueType":"void","role":"control"}] }
      ],
      "edges": [ { "from": {"node":"pay","port":"ok"}, "to": {"node":"toast_ok","port":"in"}, "kind": "control" } ],
      "entrypoints": [ { "event": "e_btn.onClick", "target": { "node": "pay", "port": "in" } } ]
    },
    "asl": {
      "models": [ { "id": "m_order", "name": "Order", "fields": [ {"id":"id","name":"id","type":"string","primary":true}, {"id":"total","name":"total","type":"number"} ] } ]
    },
    "backend": {
      "functions": [ { "id": "fn_checkout", "name": "checkout", "inputs": {}, "outputs": {"json":"object"}, "codeRef": { "module": "api/checkout.ts", "export": "handler" } } ],
      "jobs": [ { "id": "http_checkout", "trigger": { "type": "http", "method": "POST", "path": "/api/checkout" }, "handler": "fn_checkout" } ]
    }
  }
}
```

---

## 8) Authoring guidance

* Author freely with `asg/abg/atg` if you like; the loader will mount them to `axer.*`. **Persist as `axer.*`.**
* Keep semantic concerns in **axer.asl** for strong typing and AI hints.
* Use `Value` forms (Atom/Formula/Ref/SignalRef) for all props to keep data‑driven.
* Prefer tokens + variants for theming; avoid hardcoded colors/sizes in components.

---

## 9) Key index (dot‑notation)

* `axer.vsl.tokens.*`, `axer.vsl.assets.*`, `axer.vsl.componentTypes[]`, `axer.vsl.entities[]`, `axer.vsl.variants.*`, `axer.vsl.responsiveProps.*`, `axer.vsl.world.*`, `axer.vsl.lighting.*`, `axer.vsl.cameraRig.*`
* `axer.vbl.state.signals[]`, `axer.vbl.nodes[]`, `axer.vbl.edges[]`, `axer.vbl.entrypoints[]`, `axer.vbl.scheduler.*`
* `axer.asl.models[]`, `axer.asl.relations[]`, `axer.asl.queries[]`, `axer.asl.validations[]`, `axer.asl.viewModels[]?`
* `axer.backend.resources[]`, `axer.backend.functions[]`, `axer.backend.jobs[]`, `axer.backend.workflows[]`, `axer.backend.policies[]`, `axer.backend.connectors[]`, `axer.backend.secrets[]`

---

## 10) Checklist

* [ ] Implement alias normalization in loader.
* [ ] Publish schemas for `vsl`, `vbl`, `asl`, `backend`, and the envelope.
* [ ] Provide TS types via codegen & JSON Schema.
* [ ] Add runtime validators (dangling refs, unit enforcement, a11y guards).
* [ ] Provide CLI `acx lint|migrate|compile`.
* [ ] Ship sample adapters (DOM, 2D(Konva), 3D(Three/WebGPU)).
