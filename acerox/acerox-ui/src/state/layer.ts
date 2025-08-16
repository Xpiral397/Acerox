"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import { TypeRegistry } from "@/lib/registry"; // ← from the earlier step (registry/index.ts)
import type { TypeDef } from "@/lib/registry/loader";

/** Flexible types (registry-driven) */
export type NodeType = string;      // dynamic, e.g. "layer" | "container" | "text" | "image" | "3d" | ...
export type NodeID = string;

export interface TreeNode {
  id: NodeID;
  type: NodeType;
  name: string;
  expanded?: boolean;
  props?: Record<string, unknown>;
  children?: TreeNode[];            // only for expandable types per registry
}

interface LayersState {
  root: TreeNode;
  selectedId: NodeID | null;
  editingId: NodeID | null;

  // actions exposed for registry runner
  select: (id: NodeID) => void;
  toggle: (id: NodeID) => void;
  rename: (id: NodeID, name: string) => void;
  beginRename: (id: NodeID) => void;
  addChild: (parentId: NodeID, type: NodeType) => void;
  remove: (id: NodeID) => void;
  duplicate: (id: NodeID) => void;

  // examples used by 3d/4d actions
  centerNode: (id: NodeID) => void;
  spinW: (id: NodeID) => void;
}

/* ------------------ helpers ------------------ */

function uid(prefix = "n"): NodeID {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function isExpandable(def?: TypeDef | undefined) {
  // expandable iff registry allows children OR type is known layout container
  return !!def?.allowedChildren?.length;
}

function walk(root: TreeNode, fn: (n: TreeNode, parent: TreeNode | null) => void, parent: TreeNode | null = null) {
  fn(root, parent);
  root.children?.forEach((c) => walk(c, fn, root));
}

function findNode(root: TreeNode, id: NodeID) {
  let match: TreeNode | null = null;
  let parent: TreeNode | null = null;
  walk(root, (n, p) => {
    if (n.id === id) {
      match = n;
      parent = p;
    }
  });
  return { node: match as TreeNode | null, parent:parent as TreeNode | null };
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function makeChild(type: NodeType, treeRoot: TreeNode): TreeNode {
  const def = TypeRegistry.get(type);
  const defaults = def?.defaults ?? {};
  const baseId = (type || "n").slice(0, 3) || "n";

  // Name strategy:
  // - For "layer" we maintain Layer-<index> sequencing by scanning.
  // - Otherwise use defaults.name or displayName.
  let name = defaults.name || def?.displayName || type;

  if (type === "layer") {
    let max = 0;
    walk(treeRoot, (n) => {
      if (n.type === "layer") {
        const m = /^Layer-(\d+)$/.exec(n.name);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
    });
    name = `Layer-${max + 1}`;
  }

  const child: TreeNode = {
    id: nanoid(),
    type,
    name,
    expanded: def?.defaults?.expanded ?? isExpandable(def),
    props: clone(defaults.props ?? {}),
    children: isExpandable(def) ? [] : undefined,
  };

  return child;
}

/* ------------------ initial tree ------------------ */

const initialTree: TreeNode = {
  id: uid("main"),
  type: "layer",
  name: "Main",
  expanded: true,
  children: [
    {
      id: uid("lay"),
      type: "layer",
      name: "Layer-1",
      expanded: true,
      children: [
        {
          id: uid("con"),
          type: "container",
          name: "Container",
          expanded: true,
          children: [
            { id: uid("txt"), type: "text", name: "Title" },
            { id: uid("img"), type: "image", name: "Hero Image" },
          ],
        },
      ],
    },
  ],
};

/* ------------------ store ------------------ */

export const useLayers = create<LayersState>((set, get) => ({
  root: initialTree,
  selectedId: null,
  editingId: null,

  select: (id) => set({ selectedId: id }),

  toggle: (id) =>
    set((state) => {
      const { node } = findNode(state.root, id);
      if (!node) return state;
      const def = TypeRegistry.get(node.type);
      if (isExpandable(def)) node.expanded = !node.expanded;
      return { root: { ...state.root } };
    }),

  beginRename: (id) => set({ editingId: id, selectedId: id }),

  rename: (id, name) =>
    set((state) => {
      const { node } = findNode(state.root, id);
      if (node) node.name = (name ?? "").trim() || node.name;
      const editingId = state.editingId === id ? null : state.editingId;
      return { root: { ...state.root }, editingId };
    }),

  addChild: (parentId, type) =>
    set((state) => {
      const { node: parent } = findNode(state.root, parentId);
      if (!parent) return state;

      const parentDef = TypeRegistry.get(parent.type);
      // respect allowedChildren from registry (if provided)
      if (parentDef?.allowedChildren && !parentDef.allowedChildren.includes(type)) {
        console.warn(`[layers] '${type}' not allowed under '${parent.type}'`);
        return state;
      }

      parent.children ||= [];
      parent.children.push(makeChild(type, state.root));
      parent.expanded = true;

      return { root: { ...state.root } };
    }),

  remove: (id) =>
    set((state) => {
      if (state.root.id === id) return state; // don't remove root
      const { parent } = findNode(state.root, id);
      if (!parent?.children) return state;
      parent.children = parent.children.filter((c) => c.id !== id);
      const selectedId = state.selectedId === id ? null : state.selectedId;
      const editingId = state.editingId === id ? null : state.editingId;
      return { root: { ...state.root }, selectedId, editingId };
    }),

  duplicate: (id) =>
    set((state) => {
      const { node, parent } = findNode(state.root, id);
      if (!node || !parent?.children) return state;
      const copy = clone(node);
      copy.id = nanoid();
      parent.children.splice(parent.children.indexOf(node) + 1, 0, copy);
      return { root: { ...state.root } };
    }),

  // demo stubs used by registry actions
  centerNode: (id) => {
    console.log("[layers] centerNode:", id);
    // TODO: integrate with canvas camera/controller
  },

  spinW: (id) => {
    console.log("[layers] spinW:", id);
    // TODO: integrate with 4D transform once available
  },
}));

export default useLayers;
