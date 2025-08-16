"use client";

import "@/app/global"; // ensure ACER is defined (SSR + client)
import { useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Languages, HardDrive, PenTool, Palette, Search, ChevronDown } from "lucide-react";

import useNavbar from "@/state/navabr"; // <- fixed path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-ui";

function ViewTab({
  view,
  label,
  icon: Icon,
}: {
  view: Views; // type from global.d.ts
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const currentView = useNavbar((s) => s.currentView);
  const setView = useNavbar((s) => s.setView);
  const active = currentView === view;

  return (
    <button
      onClick={() => setView(view)}
      className="relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
      {active && (
        <motion.span
          layoutId="luxioer-active-underline"
          className="absolute inset-0 -z-10 rounded-2xl shadow-[0_0_0_2px_rgba(0,0,0,0.04)] ring-1 ring-border"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

function SubViewToggle() {
  const currentView = useNavbar((s) => s.currentView);
  const subView = useNavbar((s) => s.subView);
  const setSubView = useNavbar((s) => s.setSubView);
  const toggleSubView = useNavbar((s) => s.toggleSubView);

  if (currentView !== ACER.Views.Board) return null;
  const isCanvas = subView === "canvas";

  return (
    <div className="flex items-center gap-2 ml-4">
      <div className="hidden md:flex rounded-xl p-1 bg-muted/50">
        <button
          onClick={() => setSubView(ACER.SubView.canvas)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
            isCanvas ? "bg-background shadow-sm" : "opacity-70 hover:opacity-100"
          }`}
          aria-pressed={isCanvas}
        >
          <PenTool className="h-4 w-4" />
          <span>Canvas</span>
        </button>
        <button
          onClick={() => setSubView(ACER.SubView.design)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
            !isCanvas ? "bg-background shadow-sm" : "opacity-70 hover:opacity-100"
          }`}
          aria-pressed={!isCanvas}
        >
          <Palette className="h-4 w-4" />
          <span>Design</span>
        </button>
      </div>

      <Button variant="outline" className="md:hidden" onClick={toggleSubView} title="Toggle sub-view">
        {isCanvas ? <PenTool className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function AcceroxNavbar() {
  const currentView = useNavbar((s) => s.currentView);
  const subView = useNavbar((s) => s.subView);

  const breadcrumb = useMemo(() => {
    if (currentView === ACER.Views.Board) {
      return `Board / ${subView === "design" ? "Design" : "Canvas"}`;
    }
    return currentView;
  }, [currentView, subView]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary/90 to-primary shadow-sm" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">Accerox</span>
            <span className="text-xs text-muted-foreground">{breadcrumb}</span>
          </div>
        </div>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-2 rounded-2xl bg-muted/40 p-1">
          <ViewTab view={ACER.Views.Board} label="Board" icon={LayoutDashboard} />
          <ViewTab view={ACER.Views.Language} label="Language" icon={Languages} />
          <ViewTab view={ACER.Views.Driver} label="Driver" icon={HardDrive} />
          <SubViewToggle />
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            <Input placeholder="Search…" className="w-56 pl-9 rounded-xl" aria-label="Search" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <div className="mr-2 h-5 w-5 rounded-full bg-primary/80" />
                Account
                <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
         
         <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
           <ThemeToggle />
          </div>
          </div>
      </div>

      <div className="lg:hidden border-t">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center gap-2">
            <ViewTab view={ACER.Views.Board} label="Board" icon={LayoutDashboard} />
            <ViewTab view={ACER.Views.Language} label="Language" icon={Languages} />
            <ViewTab view={ACER.Views.Driver} label="Driver" icon={HardDrive} />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <SubViewToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
