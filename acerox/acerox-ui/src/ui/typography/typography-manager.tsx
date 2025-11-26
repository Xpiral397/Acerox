"use client";

import { useState, useMemo, useEffect } from "react";
import { useTypography } from "@/state/typography";
import { repositoryManager } from "@/services/font-repositories/repository-manager";
import type { Font } from "@/types/font-repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Sparkles,
  Download,
  Copy,
  Trash2,
  Search,
  Type,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import RepositorySelector from "./repository-selector";
import AITypographyChatModern from "./ai-chat-modern";
import type { TypographyAISuggestion } from "@/services/ai/typography-ai";

export default function TypographyManager() {
  const [activeTab, setActiveTab] = useState<"editor" | "fonts" | "repositories" | "ai" | "preview">("editor");
  const [previewBg, setPreviewBg] = useState("#ffffff");
  const stylesObj = useTypography((s) => s.styles);
  const styles = Object.values(stylesObj);
  const selectedStyleId = useTypography((s) => s.selectedStyleId);
  const selectStyle = useTypography((s) => s.selectStyle);
  const createStyle = useTypography((s) => s.createStyle);

  // Create a default style if none exist
  useEffect(() => {
    if (styles.length === 0) {
      createStyle({
        name: "Default Heading",
        fontFamily: "Inter, sans-serif",
        fontSize: "32px",
        fontWeight: 700,
        lineHeight: "1.2",
        letterSpacing: "-0.02em",
        color: "#000000",
        category: "heading",
      });
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar with Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === "editor"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab("fonts")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === "fonts"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            Font Library
          </button>
          <button
            onClick={() => setActiveTab("repositories")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === "repositories"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            <Database className="h-4 w-4" />
            Repositories
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              activeTab === "ai"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === "preview"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            Preview
          </button>
        </div>

        <Button
          size="sm"
          onClick={() => {
            createStyle({
              name: "New Style",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "1.5",
              letterSpacing: "0",
              color: "#000000",
              category: "custom",
            });
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Style
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Style List (Always visible) */}
        <div className="w-64 border-r bg-background flex flex-col">
          <div className="p-3 border-b">
            <Input placeholder="Search styles..." className="h-9" />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {styles.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No styles yet
              </div>
            ) : (
              <div className="space-y-1">
                {styles.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => {
                      selectStyle(style.id);
                      setActiveTab("editor"); // Auto-switch to editor when clicking a style
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStyleId === style.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{style.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {style.fontFamily.split(",")[0]} • {style.fontSize}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "editor" && <StyleEditorLarge />}
          {activeTab === "fonts" && <FontLibrary />}
          {activeTab === "repositories" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <RepositorySelector />
              </div>
            </div>
          )}
          {activeTab === "ai" && <AIAssistantTab />}
          {activeTab === "preview" && (
            <LivePreview previewBg={previewBg} setPreviewBg={setPreviewBg} />
          )}
        </div>
      </div>
    </div>
  );
}

// Large Style Editor
function StyleEditorLarge() {
  const selectedStyleId = useTypography((s) => s.selectedStyleId);
  const styles = useTypography((s) => s.styles);
  const updateStyle = useTypography((s) => s.updateStyle);
  const deleteStyle = useTypography((s) => s.deleteStyle);
  const duplicateStyle = useTypography((s) => s.duplicateStyle);
  const exportAsCSS = useTypography((s) => s.exportAsCSS);

  const style = selectedStyleId ? styles[selectedStyleId] : null;

  if (!style) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Type className="h-16 w-16 mx-auto opacity-20" />
          <div>Select a typography style to edit</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Input
          value={style.name}
          onChange={(e) => updateStyle(style.id, { name: e.target.value })}
          className="text-2xl font-semibold border-0 px-0 h-auto focus-visible:ring-0"
          placeholder="Style name"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => duplicateStyle(style.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteStyle(style.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Font Family */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Font Family</label>
        <Input
          value={style.fontFamily}
          onChange={(e) => updateStyle(style.id, { fontFamily: e.target.value })}
          placeholder="Inter, sans-serif"
        />
      </div>

      {/* Grid: Size, Weight, Line Height */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <Input
            value={style.fontSize}
            onChange={(e) => updateStyle(style.id, { fontSize: e.target.value })}
            placeholder="16px"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Weight</label>
          <Input
            value={style.fontWeight}
            onChange={(e) => updateStyle(style.id, { fontWeight: e.target.value })}
            placeholder="400"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Line Height</label>
          <Input
            value={style.lineHeight}
            onChange={(e) => updateStyle(style.id, { lineHeight: e.target.value })}
            placeholder="1.5"
          />
        </div>
      </div>

      {/* Letter Spacing & Color */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Letter Spacing</label>
          <Input
            value={style.letterSpacing}
            onChange={(e) => updateStyle(style.id, { letterSpacing: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={style.color}
              onChange={(e) => updateStyle(style.id, { color: e.target.value })}
              className="h-10 w-16 rounded border cursor-pointer"
            />
            <Input
              value={style.color}
              onChange={(e) => updateStyle(style.id, { color: e.target.value })}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Custom CSS (Advanced)</label>
        <textarea
          value={style.customCSS || ""}
          onChange={(e) => updateStyle(style.id, { customCSS: e.target.value })}
          placeholder="text-shadow: 0 2px 4px rgba(0,0,0,0.1);"
          className="w-full h-24 p-3 rounded-md border bg-background font-mono text-sm"
        />
      </div>

      <Separator />

      {/* Live Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Live Preview</label>
        <div
          className="p-6 rounded-lg border bg-muted/20"
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            color: style.color,
          }}
        >
          The quick brown fox jumps over the lazy dog
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={() => {
          const css = exportAsCSS();
          navigator.clipboard.writeText(css);
        }}>
          <Download className="h-4 w-4" />
          Export CSS
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Tokens
        </Button>
      </div>
    </div>
  );
}

// Font Library Component - with repository manager integration
function FontLibrary() {
  const createStyle = useTypography((s) => s.createStyle);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [displayLimit, setDisplayLimit] = useState(50); // Virtual scrolling via pagination

  // Load fonts from repository manager
  useEffect(() => {
    const loadFonts = async () => {
      try {
        setLoading(true);
        setError(null);
        const allFonts = await repositoryManager.fetchAllFonts({ cached: true });
        setFonts(allFonts);
      } catch (err) {
        console.error("Error loading fonts:", err);
        setError("Failed to load fonts from repositories");
      } finally {
        setLoading(false);
      }
    };

    loadFonts();
  }, []);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let filtered = fonts;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((font) =>
        font.family.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((font) => font.category === selectedCategory);
    }

    return filtered;
  }, [fonts, searchQuery, selectedCategory]);

  // Display only limited fonts for performance
  const displayedFonts = filteredFonts.slice(0, displayLimit);

  // Handle scroll to load more fonts
  const handleLoadMore = () => {
    setDisplayLimit((prev) => Math.min(prev + 50, filteredFonts.length));
  };

  const categories = useMemo(() => [
    { value: "all", label: "All Fonts", count: fonts.length },
    {
      value: "sans-serif",
      label: "Sans-serif",
      count: fonts.filter((f) => f.category === "sans-serif").length,
    },
    {
      value: "serif",
      label: "Serif",
      count: fonts.filter((f) => f.category === "serif").length,
    },
    {
      value: "display",
      label: "Display",
      count: fonts.filter((f) => f.category === "display").length,
    },
    {
      value: "handwriting",
      label: "Handwriting",
      count: fonts.filter((f) => f.category === "handwriting").length,
    },
    {
      value: "monospace",
      label: "Monospace",
      count: fonts.filter((f) => f.category === "monospace").length,
    },
  ], [fonts]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Font Library</h2>
          <p className="text-muted-foreground">
            Browse and add {fonts.length}+ Google Fonts to your project
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${fonts.length}+ Google Fonts...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayLimit(50); // Reset limit on new search
              }}
              className="pl-10"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setDisplayLimit(50); // Reset limit on category change
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading Google Fonts...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        {/* Font list */}
        {!loading && (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {displayedFonts.length} of {filteredFonts.length} fonts
            </div>

            <div className="grid gap-4">
              {displayedFonts.map((font) => (
                <FontCard
                  key={font.family}
                  font={font}
                  onAdd={async () => {
                    // Load the font dynamically
                    await repositoryManager.loadFont(font);

                    // Map repository ID to font source type
                    const fontSource = font.source === "google-fonts" ? "google" : "custom";

                    // Create typography style
                    createStyle({
                      name: `${font.family} Text`,
                      fontFamily: `'${font.family}', ${font.category}`,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.5",
                      letterSpacing: "0",
                      color: "#000000",
                      category: "custom",
                      fontSource,
                    });
                  }}
                  onPreview={async () => await repositoryManager.loadFont(font)}
                />
              ))}
            </div>

            {/* Load more button */}
            {displayedFonts.length < filteredFonts.length && (
              <div className="text-center pt-4">
                <Button onClick={handleLoadMore} variant="outline" size="lg">
                  Load More Fonts ({filteredFonts.length - displayedFonts.length} remaining)
                </Button>
              </div>
            )}

            {/* No results */}
            {filteredFonts.length === 0 && !loading && (
              <div className="text-center py-12">
                <Type className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-semibold">No fonts found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or category filter
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Font card component
function FontCard({
  font,
  onAdd,
  onPreview,
}: {
  font: any;
  onAdd: () => void;
  onPreview: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onMouseEnter={() => {
        setIsHovered(true);
        onPreview(); // Load font on hover
      }}
      onMouseLeave={() => setIsHovered(false)}
      className="p-4 rounded-lg border bg-card hover:border-primary/50 transition"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold truncate">{font.family}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize flex-shrink-0">
              {font.category}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {font.variants.length} variant{font.variants.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p
            className="text-2xl truncate"
            style={{
              fontFamily: `'${font.family}', ${font.category}`,
              transition: "all 0.2s",
            }}
          >
            The quick brown fox jumps over the lazy dog
          </p>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 flex gap-1 flex-wrap"
            >
              {font.variants.slice(0, 10).map((variant: any, idx: number) => {
                // Handle both string and object variants
                const variantText = typeof variant === 'string'
                  ? variant
                  : `${variant.weight}${variant.style === 'italic' ? 'i' : ''}`;
                const variantKey = typeof variant === 'string'
                  ? variant
                  : `${variant.weight}-${variant.style}-${idx}`;

                return (
                  <span
                    key={variantKey}
                    className="text-xs px-2 py-1 rounded bg-muted/50"
                  >
                    {variantText}
                  </span>
                );
              })}
              {font.variants.length > 10 && (
                <span className="text-xs px-2 py-1 rounded bg-muted/50">
                  +{font.variants.length - 10} more
                </span>
              )}
            </motion.div>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={onAdd} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </motion.div>
  );
}

// Live Preview Component
function LivePreview({
  previewBg,
  setPreviewBg,
}: {
  previewBg: string;
  setPreviewBg: (bg: string) => void;
}) {
  const selectedStyleId = useTypography((s) => s.selectedStyleId);
  const styles = useTypography((s) => s.styles);
  const [previewText, setPreviewText] = useState("The quick brown fox jumps over the lazy dog");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  const style = selectedStyleId ? styles[selectedStyleId] : null;

  const bgPresets = [
    { label: "White", value: "#ffffff" },
    { label: "Light Gray", value: "#f5f5f5" },
    { label: "Dark Gray", value: "#1a1a1a" },
    { label: "Black", value: "#000000" },
    { label: "Blue", value: "#1e3a8a" },
    { label: "Purple", value: "#581c87" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Controls */}
      <div className="p-4 border-b bg-muted/10 space-y-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Background:</label>
          <div className="flex gap-2">
            {bgPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setPreviewBg(preset.value)}
                className={`w-8 h-8 rounded border-2 transition ${
                  previewBg === preset.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.label}
              />
            ))}
            <input
              type="color"
              value={previewBg}
              onChange={(e) => setPreviewBg(e.target.value)}
              className="w-8 h-8 rounded border-2 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Text Align:</label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((align) => (
              <Button
                key={align}
                size="sm"
                variant={textAlign === align ? "default" : "outline"}
                onClick={() => setTextAlign(align)}
                className="capitalize"
              >
                {align}
              </Button>
            ))}
          </div>
        </div>

        <Input
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Enter preview text..."
          className="max-w-md"
        />
      </div>

      {/* Preview Area */}
      <div
        className="flex-1 flex items-center justify-center p-12 transition-colors"
        style={{ backgroundColor: previewBg }}
      >
        {style ? (
          <div
            className="max-w-4xl w-full p-8"
            style={{
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              color: style.color,
              textAlign: textAlign,
            }}
          >
            {previewText}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            Select a style to preview
          </div>
        )}
      </div>
    </div>
  );
}

// AI Assistant Tab Component
function AIAssistantTab() {
  const createStyle = useTypography((s) => s.createStyle);

  const handleApplySuggestion = (suggestion: TypographyAISuggestion) => {
    // Create a new style from the AI suggestion
    createStyle({
      name: `AI: ${suggestion.fontFamily}`,
      fontFamily: suggestion.fontFamily,
      fontSize: suggestion.fontSize,
      fontWeight: suggestion.fontWeight,
      lineHeight: suggestion.lineHeight,
      letterSpacing: suggestion.letterSpacing,
      color: suggestion.color,
      category: "custom",
    });
  };

  return (
    <AITypographyChatModern onApplySuggestion={handleApplySuggestion} />
  );
}
