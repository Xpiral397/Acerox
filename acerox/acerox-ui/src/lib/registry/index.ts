// src/registry/index.ts
"use client";
import { loadRegistry, type TypeDef } from "./loader";
import { getIcon } from "./icons";

class Registry {
  private map = new Map<string, TypeDef & { Icon?: any }>();
  async init() {
    const reg = await loadRegistry();
    this.map.clear();
    for (const t of reg.types) {
      this.map.set(t.type, { ...t, Icon: getIcon(t.icon) });
    }
  }
  get(type: string) { return this.map.get(type); }
  list() { return Array.from(this.map.values()); }
}

export const TypeRegistry = new Registry();
