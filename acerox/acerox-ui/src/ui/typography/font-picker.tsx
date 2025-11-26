"use client";

import { useState, useEffect, useMemo } from "react";
import { repositoryManager } from "@/services/font-repositories/repository-manager";
import type { Font } from "@/types/font-repository";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  textColor?: string;
}

export function FontPicker({ value, onChange, textColor = "#000000" }: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Load fonts from repository
  useEffect(() => {
    const loadFonts = async () => {
      try {
        setLoading(true);
        const allFonts = await repositoryManager.fetchAllFonts({ cached: true });
        setFonts(allFonts);
      } catch (err) {
        console.error("Error loading fonts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadFonts();
    }
  }, [isOpen]);

  // Filter fonts
  const filteredFonts = useMemo(() => {
    let filtered = fonts;

    if (searchQuery.trim()) {
      filtered = filtered.filter((font) =>
        font.family.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((font) => font.category === selectedCategory);
    }

    return filtered.slice(0, 50); // Limit to 50 for performance
  }, [fonts, searchQuery, selectedCategory]);

  const categories = [
    { value: "all", label: "All" },
    { value: "sans-serif", label: "Sans" },
    { value: "serif", label: "Serif" },
    { value: "display", label: "Display" },
    { value: "handwriting", label: "Hand" },
    { value: "monospace", label: "Mono" },
  ];

  const currentFont = value.split(",")[0].replace(/['"]/g, "").trim();

  return (
    <div className="relative">
      {/* Current Font Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 px-3 rounded border bg-background text-xs text-left hover:bg-accent transition-colors flex items-center justify-between"
      >
        <span
          className="truncate"
          style={{ fontFamily: value, color: textColor }}
        >
          {currentFont}
        </span>
        <span className="text-muted-foreground ml-2">▼</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Picker Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-xl z-50 max-h-96 flex flex-col"
            >
              {/* Search & Categories */}
              <div className="p-2 border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fonts..."
                    className="h-7 text-xs pl-7"
                    autoFocus
                  />
                </div>

                <div className="flex gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-2 py-0.5 text-[10px] rounded transition ${
                        selectedCategory === cat.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font List */}
              <div className="flex-1 overflow-y-auto p-1">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFonts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No fonts found
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredFonts.map((font) => (
                      <FontOption
                        key={font.family}
                        font={font}
                        isSelected={font.family === currentFont}
                        textColor={textColor}
                        onClick={async () => {
                          await repositoryManager.loadFont(font);
                          onChange(`'${font.family}', ${font.category}`);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t text-[10px] text-muted-foreground">
                Showing {filteredFonts.length} fonts
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FontOption({
  font,
  isSelected,
  textColor,
  onClick,
}: {
  font: Font;
  isSelected: boolean;
  textColor: string;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full p-2 rounded text-left transition-colors ${
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-accent"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium truncate">{font.family}</span>
            <Badge
              variant="secondary"
              className="text-[9px] h-4 px-1 capitalize"
            >
              {font.category}
            </Badge>
          </div>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-1 text-sm truncate"
              style={{
                fontFamily: `'${font.family}', ${font.category}`,
                color: textColor,
              }}
            >
              The quick brown fox
            </motion.div>
          )}
        </div>
        {isSelected && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
      </div>
    </button>
  );
}
