// app/components/AcceroxSidebar.tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Package2, Layers as LayersIcon, SlidersHorizontal, AlignCenterVertical,
  Book, Palette, Wand2, Ruler, Settings, UploadCloud, Plus, Search
} from "lucide-react";
import useNavbar from "@/state/navabr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// motion presets
const spring300 = { type: "spring", stiffness: 300, damping: 26 } as const;
const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: spring300 },
  exit: { opacity: 0, y: 6, transition: { type: "tween", duration: 0.15, ease: "easeOut" } },
} as const;

// reusable shell
function PanelCard({
  title,
  toolbar,
  children,
}: {
  title: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeSlide}
      className="rounded-2xl border bg-background p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</h3>
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

// upload box (drag & drop or click)
function UploadBox({
  onFiles,
  hint = "Drop files or click to upload",
  accept = "*",
}: {
  onFiles: (files: FileList) => void;
  hint?: string;
  accept?: string;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => inputRef.current?.click(), []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={openPicker}
      className={[
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3",
        "transition",
        drag ? "border-primary/60 bg-primary/5" : "hover:bg-accent/50"
      ].join(" ")}
      role="button"
      aria-label="Upload files"
    >
      <UploadCloud className="h-5 w-5 opacity-80" />
      <div className="flex-1">
        <div className="text-sm">Attach assets</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={(e) => e.target.files && onFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}

// quick grid for components/assets
function ComponentsGrid() {
  const items = useMemo(
    () => [
      { icon: Cpu, label: "AI Box" },
      { icon: Package2, label: "Components" },
      { icon: LayersIcon, label: "Layers" },
    ],
    []
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ icon: Icon, label }) => (
        <button
          key={label}
          className="flex items-center gap-2 rounded-xl border p-2 text-sm transition hover:bg-accent/40"
        >
          <Icon className="h-4 w-4" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

// shared layers panel (used by Canvas and Design)
function LayersPanel() {
  return (
    <PanelCard
      title="Layers"
      toolbar={
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 opacity-70" />
        <Input placeholder="Filter layers…" className="h-8" />
      </div>
      <div className="space-y-1">
        {["Header", "Card Group", "CTA Button", "Footer"].map((n) => (
          <div
            key={n}
            className="flex items-center justify-between rounded-lg border p-2 text-sm hover:bg-accent/40"
          >
            <span className="truncate">{n}</span>
            <span className="text-xs text-muted-foreground">visible</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function PropertiesPanel() {
  return (
    <PanelCard title="Properties">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-muted-foreground">X</div>
          <Input defaultValue="0" className="h-8" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Y</div>
          <Input defaultValue="0" className="h-8" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">W</div>
          <Input defaultValue="320" className="h-8" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">H</div>
          <Input defaultValue="180" className="h-8" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <div className="text-xs text-muted-foreground">Name</div>
          <Input defaultValue="Card Group" className="h-8" />
        </div>
        <div className="col-span-2">
          <div className="text-xs text-muted-foreground">Notes</div>
          <Input placeholder="Describe this element…" className="h-8" />
        </div>
      </div>
    </PanelCard>
  );
}

function TokensPanel() {
  return (
    <PanelCard title="Tokens">
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Primary</button>
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Surface</button>
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Text</button>
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Accent</button>
      </div>
    </PanelCard>
  );
}

function AlignPanel() {
  return (
    <PanelCard title="Align & Arrange">
      <div className="grid grid-cols-3 gap-2">
        {["Left", "Center", "Right", "Top", "Middle", "Bottom"].map((k) => (
          <button key={k} className="rounded-lg border p-2 text-xs hover:bg-accent/40">
            {k}
          </button>
        ))}
      </div>
    </PanelCard>
  );
}

function EffectsPanel() {
  return (
    <PanelCard title="Effects">
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Shadow</button>
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Blur</button>
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Radius</button>
        <button className="rounded-lg border p-2 text-sm hover:bg-accent/40">Stroke</button>
      </div>
    </PanelCard>
  );
}

function SettingsPanel() {
  return (
    <PanelCard title="Settings">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Snap</div>
          <Input defaultValue="8 px" className="h-8" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Grid</div>
          <Input defaultValue="12 cols" className="h-8" />
        </div>
      </div>
    </PanelCard>
  );
}

export default function AcceroxSidebar() {
  const currentView = useNavbar((s) => s.currentView);
  const subView = useNavbar((s) => s.subView);

  const isBoard = currentView === ACER.Views.Board;
  const isCanvas = subView === ACER.SubView.canvas;

  // canvas stack
  const canvasPanels = (
    <div className="space-y-3">
      <PanelCard
        title="Assets"
        toolbar={<Button size="sm" variant="outline" className="h-8">Browse</Button>}
      >
        <UploadBox
          onFiles={(files) => console.log("canvas files:", files)}
          hint="Images, SVG, JSON, GLTF…"
          accept="image/*,.json,.gltf,.glb,.svg"
        />
        <ComponentsGrid />
      </PanelCard>

      <PropertiesPanel />
      <AlignPanel />
      <TokensPanel />
      <SettingsPanel />
      <LayersPanel />
    </div>
  );

  // design stack
  const designPanels = (
    <div className="space-y-3">
      <PanelCard title="Palettes" toolbar={<Button size="sm" className="h-8"><Palette className="h-4 w-4" /></Button>}>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 rounded-lg border bg-muted/60" />
          ))}
        </div>
      </PanelCard>

      <EffectsPanel />
      <PropertiesPanel />
      <TokensPanel />
      <SettingsPanel />
      <LayersPanel />
    </div>
  );

  return (
    <aside className="h-[calc(100dvh)] w-80 border-r bg-background px-3 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight">
          {isBoard ? (isCanvas ? "Board · Canvas" : "Board · Design") : String(currentView)}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator />
      <div className="mt-3 h-[calc(100dvh-4.5rem)] overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {isBoard && isCanvas && (
            <motion.div key="board-canvas" initial="initial" animate="animate" exit="exit" variants={fadeSlide}>
              {canvasPanels}
            </motion.div>
          )}
          {isBoard && !isCanvas && (
            <motion.div key="board-design" initial="initial" animate="animate" exit="exit" variants={fadeSlide}>
              {designPanels}
            </motion.div>
          )}
          {!isBoard && (
            <motion.div key="other" initial="initial" animate="animate" exit="exit" variants={fadeSlide}>
              <PanelCard title="Coming soon">
                <div className="text-sm text-muted-foreground">Sidebar for {String(currentView)}.</div>
              </PanelCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside> 
  );
}
