"use client";

import AcceroxNavbar from "@/ui/navbar/MainNavbar";
import UnifiedTypographyWorkspace from "@/ui/typography/unified-typography-workspace";

export default function TypographyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AcceroxNavbar />
      <main className="flex-1 h-[calc(100vh-64px)]">
        <UnifiedTypographyWorkspace />
      </main>
    </div>
  );
}
