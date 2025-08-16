// src/registry/loader.ts
import { z } from "zod";

const ZAction = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  run: z.string(), // e.g. "duplicate" or "addChild:text"
});

const ZType = z.object({
  type: z.string(),
  displayName: z.string(),
  icon: z.string().optional(),
  defaults: z.object({
    name: z.string().optional(),
    expanded: z.boolean().optional(),
    props: z.record(z.any()).optional(),
  }).default({}),
  allowedChildren: z.array(z.string()).optional(),
  actions: z.array(ZAction).optional(),
  events: z.object({
    onClick: z.string().optional(),
    onDoubleClick: z.string().optional(),
    onHover: z.string().optional(),
  }).partial().optional()
});

const ZRegistry = z.object({ types: z.array(ZType) });
export type Registry = z.infer<typeof ZRegistry>;
export type TypeDef = z.infer<typeof ZType>;

export async function loadRegistry(): Promise<Registry> {
  const res = await fetch("/registry.json", { cache: "no-store" });
  const raw = await res.json();
  return ZRegistry.parse(raw);
}
