// src/registry/icons.ts
import * as L from "lucide-react";

export function getIcon(name?: string) {
  if (!name) return null;
  const Icon = (L as any)[name];
  return typeof Icon === "function" ? Icon : null;
}
