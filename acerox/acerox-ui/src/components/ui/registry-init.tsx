// src/app/registry-init.tsx
"use client";
import { useEffect } from "react";
import { TypeRegistry } from "@/lib/registry";

export default function RegistryInit() {
  useEffect(() => { TypeRegistry.init(); }, []);
  return null;
}
