"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Palette,
  Sparkles,
  Box,
  Code,
  Play,
  Pause,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTypography, type TypographyStyle } from "@/state/typography";

export function TypographyEditor() {
  const {
    styles,
    selectedStyleId,
    previewText,
    selectStyle,
    updateStyle,
    createStyle,
    setPreviewText,
  } = useTypography();

  const [isAnimating, setIsAnimating] = useState(false);
  const [customCSSKey, setCustomCSSKey] = useState("");
  const [customCSSValue, setCustomCSSValue] = useState("");

  const selectedStyle = selectedStyleId ? styles[selectedStyleId] : null;

  // Create initial style if none exists
  useEffect(() => {
    if (Object.keys(styles).length === 0) {
      const id = createStyle({
        name: "New Typography Style",
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
        fontWeight: 400,
        lineHeight: "1.5",
        letterSpacing: "0",
        color: "#000000",
        preview: previewText,
      });
      selectStyle(id);
    }
  }, []);

  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedStyleId) return;
    updateStyle(selectedStyleId, { [property]: value });
  };

  const handleAnimationChange = (property: string, value: any) => {
    if (!selectedStyleId) return;
    const currentAnimation = selectedStyle?.animation || {};
    updateStyle(selectedStyleId, {
      animation: {
        ...currentAnimation,
        [property]: value,
      },
    });
  };

  const handle3DChange = (property: string, value: number) => {
    if (!selectedStyleId) return;
    const current3D = selectedStyle?.transform3D || {};
    updateStyle(selectedStyleId, {
      transform3D: {
        ...current3D,
        [property]: value,
      },
    });
  };

  const addCustomCSSProperty = () => {
    if (!selectedStyleId || !customCSSKey || !customCSSValue) return;
    const currentProps = selectedStyle?.customCSSProperties || {};
    updateStyle(selectedStyleId, {
      customCSSProperties: {
        ...currentProps,
        [customCSSKey]: customCSSValue,
      },
    });
    setCustomCSSKey("");
    setCustomCSSValue("");
  };

  const removeCustomCSSProperty = (key: string) => {
    if (!selectedStyleId) return;
    const currentProps = { ...(selectedStyle?.customCSSProperties || {}) };
    delete currentProps[key];
    updateStyle(selectedStyleId, {
      customCSSProperties: currentProps,
    });
  };

  // Build style object for preview
  const getPreviewStyle = () => {
    if (!selectedStyle) return {};

    const baseStyle: React.CSSProperties = {
      fontFamily: selectedStyle.fontFamily,
      fontSize: selectedStyle.fontSize,
      fontWeight: selectedStyle.fontWeight,
      lineHeight: selectedStyle.lineHeight,
      letterSpacing: selectedStyle.letterSpacing,
      color: selectedStyle.color,
      textTransform: selectedStyle.textTransform,
      textDecoration: selectedStyle.textDecoration,
      fontStyle: selectedStyle.fontStyle,
      textShadow: selectedStyle.textShadow,
      wordSpacing: selectedStyle.wordSpacing,
      whiteSpace: selectedStyle.whiteSpace,
    };

    // Add 3D transforms
    if (selectedStyle.transform3D) {
      const { rotateX, rotateY, rotateZ, translateZ, perspective } =
        selectedStyle.transform3D;
      const transforms = [];
      if (perspective) transforms.push(`perspective(${perspective}px)`);
      if (rotateX) transforms.push(`rotateX(${rotateX}deg)`);
      if (rotateY) transforms.push(`rotateY(${rotateY}deg)`);
      if (rotateZ) transforms.push(`rotateZ(${rotateZ}deg)`);
      if (translateZ) transforms.push(`translateZ(${translateZ}px)`);
      if (transforms.length > 0) {
        baseStyle.transform = transforms.join(" ");
        baseStyle.transformStyle = "preserve-3d";
      }
    }

    // Add custom CSS properties
    if (selectedStyle.customCSSProperties) {
      Object.entries(selectedStyle.customCSSProperties).forEach(
        ([key, value]) => {
          (baseStyle as any)[key] = value;
        }
      );
    }

    return baseStyle;
  };

  // Build animation props for Framer Motion
  const getAnimationProps = () => {
    if (!selectedStyle?.animation || !isAnimating) return {};

    const { type, duration, delay, easing, direction } =
      selectedStyle.animation;

    const animations: Record<string, any> = {
      fade: { opacity: [0, 1] },
      slide: {
        x: direction === "left" ? [-50, 0] : direction === "right" ? [50, 0] : 0,
        y: direction === "up" ? [-50, 0] : direction === "down" ? [50, 0] : 0,
      },
      scale: { scale: [0.8, 1] },
      rotate: { rotate: [0, 360] },
      bounce: { y: [0, -20, 0] },
    };

    return {
      animate: animations[type || "fade"] || { opacity: [0, 1] },
      transition: {
        duration: (duration || 1000) / 1000,
        delay: (delay || 0) / 1000,
        ease: easing || "easeOut",
      },
    };
  };

  if (!selectedStyle) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Type className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No typography style selected
          </p>
          <Button
            onClick={() =>
              createStyle({
                name: "New Typography Style",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "1.5",
                letterSpacing: "0",
                color: "#000000",
              })
            }
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Style
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Preview Section */}
      <div className="border-b bg-muted/30 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{selectedStyle.name}</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>
        </div>

        {/* Live Preview */}
        <div className="rounded-lg border bg-background p-8">
          <motion.div
            key={isAnimating ? "animating" : "static"}
            {...(isAnimating ? getAnimationProps() : {})}
            style={getPreviewStyle()}
            className="text-center"
          >
            {previewText}
          </motion.div>
        </div>

        {/* Preview Text Input */}
        <div className="mt-4">
          <Input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Enter preview text..."
            className="text-center"
          />
        </div>
      </div>

      {/* Editor Sections */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Font Properties */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Font Properties</h3>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={selectedStyle.fontFamily}
                  onChange={(e) =>
                    handlePropertyChange("fontFamily", e.target.value)
                  }
                  placeholder="Inter, sans-serif"
                />
              </div>
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  value={selectedStyle.fontSize}
                  onChange={(e) =>
                    handlePropertyChange("fontSize", e.target.value)
                  }
                  placeholder="16px"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontWeight">Font Weight</Label>
                <Input
                  id="fontWeight"
                  type="number"
                  value={selectedStyle.fontWeight}
                  onChange={(e) =>
                    handlePropertyChange("fontWeight", Number(e.target.value))
                  }
                  placeholder="400"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={selectedStyle.color}
                    onChange={(e) => handlePropertyChange("color", e.target.value)}
                    className="h-10 w-16"
                  />
                  <Input
                    value={selectedStyle.color}
                    onChange={(e) => handlePropertyChange("color", e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lineHeight">Line Height</Label>
                <Input
                  id="lineHeight"
                  value={selectedStyle.lineHeight}
                  onChange={(e) =>
                    handlePropertyChange("lineHeight", e.target.value)
                  }
                  placeholder="1.5"
                />
              </div>
              <div>
                <Label htmlFor="letterSpacing">Letter Spacing</Label>
                <Input
                  id="letterSpacing"
                  value={selectedStyle.letterSpacing}
                  onChange={(e) =>
                    handlePropertyChange("letterSpacing", e.target.value)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Animation */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Animation</h3>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animationType">Type</Label>
                <select
                  id="animationType"
                  value={selectedStyle.animation?.type || ""}
                  onChange={(e) => handleAnimationChange("type", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="scale">Scale</option>
                  <option value="rotate">Rotate</option>
                  <option value="bounce">Bounce</option>
                </select>
              </div>
              <div>
                <Label htmlFor="animationDuration">Duration (ms)</Label>
                <Input
                  id="animationDuration"
                  type="number"
                  value={selectedStyle.animation?.duration || 1000}
                  onChange={(e) =>
                    handleAnimationChange("duration", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animationEasing">Easing</Label>
                <select
                  id="animationEasing"
                  value={selectedStyle.animation?.easing || "easeOut"}
                  onChange={(e) => handleAnimationChange("easing", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="linear">Linear</option>
                  <option value="easeIn">Ease In</option>
                  <option value="easeOut">Ease Out</option>
                  <option value="easeInOut">Ease In Out</option>
                </select>
              </div>
              <div>
                <Label htmlFor="animationDirection">Direction</Label>
                <select
                  id="animationDirection"
                  value={selectedStyle.animation?.direction || "up"}
                  onChange={(e) =>
                    handleAnimationChange("direction", e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 3D Effects */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">3D Transform</h3>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rotateX">Rotate X</Label>
                <Input
                  id="rotateX"
                  type="number"
                  value={selectedStyle.transform3D?.rotateX || 0}
                  onChange={(e) => handle3DChange("rotateX", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="rotateY">Rotate Y</Label>
                <Input
                  id="rotateY"
                  type="number"
                  value={selectedStyle.transform3D?.rotateY || 0}
                  onChange={(e) => handle3DChange("rotateY", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rotateZ">Rotate Z</Label>
                <Input
                  id="rotateZ"
                  type="number"
                  value={selectedStyle.transform3D?.rotateZ || 0}
                  onChange={(e) => handle3DChange("rotateZ", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="perspective">Perspective</Label>
                <Input
                  id="perspective"
                  type="number"
                  value={selectedStyle.transform3D?.perspective || 1000}
                  onChange={(e) =>
                    handle3DChange("perspective", Number(e.target.value))
                  }
                  placeholder="1000"
                />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Custom CSS Properties */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Custom CSS Properties</h3>
          </div>

          {/* Add New Property */}
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Property (e.g., text-shadow)"
              value={customCSSKey}
              onChange={(e) => setCustomCSSKey(e.target.value)}
            />
            <Input
              placeholder="Value (e.g., 2px 2px 4px rgba(0,0,0,0.3))"
              value={customCSSValue}
              onChange={(e) => setCustomCSSValue(e.target.value)}
            />
            <Button onClick={addCustomCSSProperty} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Existing Properties */}
          {selectedStyle.customCSSProperties &&
            Object.entries(selectedStyle.customCSSProperties).length > 0 && (
              <div className="space-y-2">
                {Object.entries(selectedStyle.customCSSProperties).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium">{key}</div>
                        <div className="text-xs text-muted-foreground">{value}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomCSSProperty(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

export default TypographyEditor;
