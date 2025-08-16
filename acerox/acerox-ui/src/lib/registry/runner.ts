// src/registry/runner.ts
import useLayers from "@/state/layer";

export function runStoreAction(signature: string, nodeId: string) {
  const [fn, arg] = signature.split(":");          // e.g. "addChild", "text"
  const store = useLayers.getState();

  switch (fn) {
    case "select":       return store.select(nodeId);
    case "remove":       return store.remove(nodeId);
    case "duplicate":    return store.duplicate(nodeId);
    case "beginRename":  return store.beginRename(nodeId);
    case "centerNode":   return store.centerNode(nodeId);
    case "spinW":        return store.spinW(nodeId);
    case "addChild":     return arg ? store.addChild(nodeId, arg) : null;
    // add more generic shims here as your store grows
    default:
      console.warn("[registry] unknown action:", signature);
  }
}
