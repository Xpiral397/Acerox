// src/libs/actions.ts
import useLayers from "@/state/layer";

export type ActionCtx = { selectedId: string | null };

export function runMenuAction(label: string, ctx: ActionCtx) {
  const layers = useLayers.getState();
  const id = ctx.selectedId ?? layers.root.id;

  switch (label) {
    // Inserts
    case "Layer":      return layers.addChild(id, "layer");
    case "Container":  return layers.addChild(id, "container");
    case "Text":       return layers.addChild(id, "text");
    case "Image":      return layers.addChild(id, "image");

    // Arrange / Order (stub to your canvas ops later)
    case "Bring To Front":
    case "Send To Back":
    case "Left":
    case "Center":
    case "Right":
    case "Top":
    case "Middle":
    case "Bottom":
      // TODO: hook to canvas controller
      return;

    // Design tokens / effects (open side panels later)
    case "Primary":
    case "Surface":
    case "Text":
    case "Accent":
    case "Shadow":
    case "Blur":
    case "Radius":
    case "Stroke":
      // TODO: open panel
      return;

    default:
      // Example: CloneObject -> Left
      if (label === "Left" && ctx.selectedId) {
        return duplicateNode(ctx.selectedId);
      }
  }
}

// helper kept in libs to keep UI clean
function duplicateNode(id: string) {
  const s = useLayers.getState();
  const root = s.root;

  function find(n: any, target: string, parent: any = null): { node?: any; parent?: any } {
    if (n.id === target) return { node: n, parent };
    for (const c of n.children ?? []) {
      const r = find(c, target, n);
      if (r.node) return r;
    }
    return {};
  }

  const { node, parent } = find(root, id);
  if (node && parent?.children) {
    const copy = JSON.parse(JSON.stringify(node));
    copy.id = `dup_${Math.random().toString(36).slice(2, 7)}`;
    copy.name = `${node.name} Copy`;
    parent.children.splice(parent.children.indexOf(node) + 1, 0, copy);
    useLayers.setState({ root: { ...root } });
  }
}
