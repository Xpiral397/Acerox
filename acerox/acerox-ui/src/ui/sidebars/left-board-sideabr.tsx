// app/components/LeftHierarchySidebar.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Layers as LayersIcon,
  Box,
  Type,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  Trash2,
  PencilLine,
  ChevronsUpDown,
  Search,
} from "lucide-react";

import useNavbar from "@/state/navabr"; // ✅ fixed path
import useLayers, { type TreeNode } from "@/state/layer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

/** Menus + action bindings live in libs */
import { MENU_CANVAS, MENU_DESIGN, type MenuJSON, type MenuValue } from "@/lib/sideabar/menus";
import { runMenuAction, type ActionCtx } from "@/lib/sideabar/actions";

/* ───────────────────────────── motion */
const spring300 = { type: "spring", stiffness: 300, damping: 26 } as const;
const fadeSlide = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: spring300 },
  exit: { opacity: 0, y: 4, transition: { type: "tween", duration: 0.15, ease: "easeOut" } },
} as const;

/* ───────────────────────────── helpers */
function nodeIcon(type: TreeNode["type"]) {
  if (type === "layer") return <LayersIcon className="h-4 w-4 opacity-80" />;
  if (type === "container") return <Box className="h-4 w-4 opacity-80" />;
  if (type === "text") return <Type className="h-4 w-4 opacity-80" />;
  return <ImageIcon className="h-4 w-4 opacity-80" />;
}

/* ───────────────────────────── menu renderers */
function MenuFromJSON({ json, ctx }: { json: MenuJSON; ctx: ActionCtx }) {
  const entries = Object.entries(json);
  return (
    <>
      {entries.map(([label, value]) => {
        if (typeof value === "string") {
          return (
            <DropdownMenuItem key={label} onClick={() => runMenuAction(value, ctx)}>
              {value}
            </DropdownMenuItem>
          );
        }
        if (Array.isArray(value)) {
          return (
            <div key={label}>
              <DropdownMenuLabel>{label}</DropdownMenuLabel>
              {value.map((v, i) =>
                typeof v === "string" ? (
                  <DropdownMenuItem key={`${label}-${v}-${i}`} onClick={() => runMenuAction(v, ctx)}>
                    {v}
                  </DropdownMenuItem>
                ) : (
                  <MenuGroup key={`${label}-grp-${i}`} json={v} ctx={ctx} />
                )
              )}
              <DropdownMenuSeparator />
            </div>
          );
        }
        return <MenuGroup key={label} json={{ [label]: value }} ctx={ctx} />;
      })}
    </>
  );
}

function MenuGroup({ json, ctx }: { json: MenuJSON; ctx: ActionCtx }) {
  return (
    <>
      {Object.entries(json).map(([groupName, groupValue]) => {
        if (typeof groupValue === "string") {
          return (
            <DropdownMenuItem key={groupName} onClick={() => runMenuAction(groupValue, ctx)}>
              {groupValue}
            </DropdownMenuItem>
          );
        }
        if (Array.isArray(groupValue)) {
          return (
            <div key={groupName}>
              <DropdownMenuLabel>{groupName}</DropdownMenuLabel>
              {groupValue.map((v, i) =>
                typeof v === "string" ? (
                  <DropdownMenuItem key={`${groupName}-${v}-${i}`} onClick={() => runMenuAction(v, ctx)}>
                    {v}
                  </DropdownMenuItem>
                ) : (
                  <MenuGroup key={`${groupName}-grp-${i}`} json={v} ctx={ctx} />
                )
              )}
              <DropdownMenuSeparator />
            </div>
          );
        }
        return (
          <div key={`${groupName}-nested`}>
            <DropdownMenuLabel>{groupName}</DropdownMenuLabel>
            <MenuFromJSON json={groupName ? (groupValue as MenuJSON) : {}} ctx={ctx} />
            <DropdownMenuSeparator />
          </div>
        );
      })}
    </>
  );
}

/* ───────────────────────────── tree row */
function NodeRow({ n, depth }: { n: TreeNode; depth: number }) {
  const selectedId = useLayers((s) => s.selectedId);
  const select = useLayers((s) => s.select);
  const toggle = useLayers((s) => s.toggle);
  const rename = useLayers((s) => s.rename);
  const addChild = useLayers((s) => s.addChild);
  const remove = useLayers((s) => s.remove);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(n.name);

  const expandable = n.type === "layer" || n.type === "container";
  const isSelected = selectedId === n.id;

  const safeChildren = useMemo(
    () => (Array.isArray(n.children) ? n.children.filter((c) => c && c.id !== n.id) : []),
    [n.children, n.id]
  );

  const onClickRow = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-caret]") || target.closest("[data-menu]")) return;
      select(n.id);
    },
    [select, n.id]
  );

  return (
    <div>
      <div
        className={[
          "group flex items-center gap-1 rounded-md px-2 py-1 text-sm",
          isSelected ? "bg-primary/10 ring-1 ring-primary/15 text-foreground" : "hover:bg-muted/60",
        ].join(" ")}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={onClickRow}
      >
        {expandable ? (
          <button
            data-caret
            onClick={() => toggle(n.id)}
            className="mr-1 rounded p-0.5 hover:bg-accent"
            aria-label={n.expanded ? "Collapse" : "Expand"}
          >
            {n.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className="shrink-0">{nodeIcon(n.type)}</span>

        {editing ? (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              rename(n.id, value);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                rename(n.id, value);
                setEditing(false);
              } else if (e.key === "Escape") {
                setValue(n.name);
                setEditing(false);
              }
            }}
            className="ml-2 h-7 w-full"
          />
        ) : (
          <span className="ml-2 truncate">{n.name}</span>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {expandable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-menu variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Add</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => addChild(n.id, "layer")}>Layer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addChild(n.id, "container")}>Container</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addChild(n.id, "text")}>Text</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addChild(n.id, "image")}>Image</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-menu variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <PencilLine className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // duplicate via libs action for consistency
                  runMenuAction("Left", { selectedId: n.id });
                }}
              >
                <ChevronsUpDown className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => remove(n.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expandable && n.expanded && safeChildren.length > 0 ? (
          <motion.div
            key={`${n.id}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: spring300 }}
            exit={{ height: 0, opacity: 0, transition: { type: "tween", duration: 0.15 } }}
          >
            {safeChildren.map((c) => (
              <NodeRow key={c.id} n={c} depth={depth + 1} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────────── sidebar */
export default function LeftHierarchySidebar() {
  const view = useNavbar((s) => s.currentView);
  const sub = useNavbar((s) => s.subView);
  const root = useLayers((s) => s.root);
  const [filter, setFilter] = useState("");

  const title = useMemo(() => {
    const isBoard = view === "Board";
    const isCanvas = sub === "canvas";
    return isBoard ? `Layers · ${isCanvas ? "Canvas" : "Design"}` : "Layers";
  }, [view, sub]);

  const menuJson = sub === "design" ? MENU_DESIGN : MENU_CANVAS;

  // optional client-side filter (by name)
  const rootFiltered = useMemo(() => {
    if (!filter.trim()) return root;
    const q = filter.toLowerCase();
    const filterTree = (n: TreeNode): TreeNode | null => {
      const kids = (n.children || []).map(filterTree).filter(Boolean) as TreeNode[];
      if (n.name.toLowerCase().includes(q) || kids.length) {
        return { ...n, children: kids };
      }
      return null;
    };
    return filterTree(root) || root;
  }, [root, filter]);

  return (
    <aside className="h-[100dvh] w-72 border-r bg-background px-3 py-3">
      {/* Header / toolbar */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex-1 text-sm font-semibold tracking-tight">{title}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="mr-2 h-4 w-4" /> Add…
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <MenuFromJSON json={menuJson} ctx={{ selectedId: useLayers.getState().selectedId }} />
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 px-2" title="Expand/Collapse">
              <ChevronDown className="h-4 w-4 rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => expandCollapseAll(true)}>Expand all</DropdownMenuItem>
            <DropdownMenuItem onClick={() => expandCollapseAll(false)}>Collapse all</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Search className="h-4 w-4 opacity-70" />
        <Input
          placeholder="Filter…"
          className="h-8"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Separator />

      {/* Tree */}
      <div className="mt-2 h-[calc(100dvh-7.5rem)] overflow-y-auto pr-1">
        <motion.div initial="initial" animate="animate" exit="exit" variants={fadeSlide} className="space-y-0.5">
          <NodeRow n={rootFiltered} depth={0} />
        </motion.div>
      </div>
    </aside>
  );
}

/* ───────────────────────────── expand/collapse helpers */
function expandCollapseAll(expand: boolean) {
  const s = useLayers.getState();
  const toggleAll = (n: TreeNode) => {
    if (n.type === "layer" || n.type === "container") n.expanded = expand;
    n.children?.forEach(toggleAll);
  };
  toggleAll(s.root);
  useLayers.setState({ root: { ...s.root } });
}
