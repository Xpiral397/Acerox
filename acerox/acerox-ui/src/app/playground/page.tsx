"use client";

import AcceroxNavbar from "@/ui/navbar/MainNavbar";
import AcceroxSidebar from "@/ui/sidebars/board-sidebar";          // right sidebar
import LeftHierarchySidebar from "@/ui/sidebars/left-board-sideabr";
import { TypeRegistry } from "@/lib/registry";
import React from "react";

import { Engine } from "@accerox/engine";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div id="navbar-id">
        <AcceroxNavbar />
      </div>

      {/* Content area fills the rest of the viewport */}
      <main className="flex-1 min-h-0">
        {/* 3-column app shell: left / center / right */}
        <div className="grid grid-cols-[280px_1fr_320px] gap-0 h-full min-h-[calc(100vh-4rem)]">
          {/* Left sidebar */}
          <aside className="border-r bg-muted/30 overflow-auto">
            <LeftHierarchySidebar />
          </aside>

          {/* Center canvas/workspace */}
          <section className="bg-background overflow-auto">
            {/* Put your canvas here */}
            <div className="h-full w-full">
              {/* canvas / board content */}
            </div>
          </section>

          {/* Right sidebar */}
          <aside className="border-l bg-muted/20 overflow-auto">
            <AcceroxSidebar />
          </aside>
        </div>
      </main>
    </div>
  );
}
