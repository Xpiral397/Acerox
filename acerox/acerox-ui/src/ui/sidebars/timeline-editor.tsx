"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  FileCode,
  Video,
  Code2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTypography } from "@/state/typography";
import {
  exportAsCSS as exportTimelineCSS,
  exportAsReact,
  exportAsVideoMetadata,
  downloadFile,
} from "@/utils/timeline-export";
import {
  ANIMATION_TEMPLATES,
  type AnimationTemplate,
} from "@/data/animation-templates";
import { Badge } from "@/components/ui/badge";

interface Keyframe {
  id: string;
  time: number;
  properties: Record<string, any>;
  transition?: {
    duration: number;
    easing: string;
  };
}

interface TimelineEditorProps {
  styleId: string;
  previewText?: string;
}

const EASING_OPTIONS = [
  "linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "cubic-bezier(0.4, 0, 0.2, 1)",
];

const COMMON_PROPERTIES = [
  { key: "color", label: "Color", type: "color" },
  { key: "opacity", label: "Opacity", type: "number", min: 0, max: 1, step: 0.1 },
  { key: "scale", label: "Scale", type: "number", min: 0, max: 3, step: 0.1 },
  { key: "rotateX", label: "Rotate X", type: "number", min: -180, max: 180 },
  { key: "rotateY", label: "Rotate Y", type: "number", min: -180, max: 180 },
  { key: "rotateZ", label: "Rotate Z", type: "number", min: -180, max: 180 },
  { key: "translateX", label: "Translate X", type: "number", min: -200, max: 200 },
  { key: "translateY", label: "Translate Y", type: "number", min: -200, max: 200 },
];

export function TimelineEditor({ styleId, previewText = "Aa" }: TimelineEditorProps) {
  const { styles, updateStyle, customAnimationPresets, saveCustomAnimationPreset, deleteCustomAnimationPreset } = useTypography();
  const style = styles[styleId];

  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [keyframes, setKeyframes] = useState<Keyframe[]>(
    style?.keyframes || [
      {
        id: "kf_0",
        time: 0,
        properties: { color: style?.color || "#000000", opacity: 1 },
        transition: { duration: 1, easing: "ease-out" },
      },
    ]
  );

  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(
    keyframes[0]?.id || null
  );
  const [duration, setDuration] = useState(10); // Total timeline duration in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPropertyAdd, setShowPropertyAdd] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync keyframes to typography state
  useEffect(() => {
    if (style) {
      updateStyle(styleId, { keyframes });
    }
  }, [keyframes]);

  // Animation playback
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now() - currentTime * 1000;

      const animate = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;

        if (elapsed >= duration) {
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(elapsed);
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration]);

  const addKeyframe = (time?: number) => {
    const newTime = time ?? currentTime;
    const newKeyframe: Keyframe = {
      id: `kf_${Date.now()}`,
      time: newTime,
      properties: { color: style?.color || "#000000", opacity: 1 },
      transition: { duration: 1, easing: "ease-out" },
    };

    const newKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    setKeyframes(newKeyframes);
    setSelectedKeyframeId(newKeyframe.id);
    setSelectedPreset(null); // Clear preset when manually adding keyframes
  };

  const removeKeyframe = (id: string) => {
    if (keyframes.length <= 1) return; // Keep at least one keyframe

    const newKeyframes = keyframes.filter((kf) => kf.id !== id);
    setKeyframes(newKeyframes);
    setSelectedPreset(null); // Clear preset when manually removing keyframes

    if (selectedKeyframeId === id) {
      setSelectedKeyframeId(newKeyframes[0]?.id || null);
    }
  };

  const updateKeyframe = (id: string, updates: Partial<Keyframe>) => {
    setKeyframes((prev) =>
      prev.map((kf) =>
        kf.id === id
          ? {
              ...kf,
              ...updates,
              properties: updates.properties
                ? { ...kf.properties, ...updates.properties }
                : kf.properties,
              transition: updates.transition
                ? { ...kf.transition, ...updates.transition }
                : kf.transition,
            }
          : kf
      ).sort((a, b) => a.time - b.time)
    );
    // Only clear preset if we're updating transition or properties, not just time from dragging
    if (updates.transition || updates.properties) {
      setSelectedPreset(null);
    }
  };

  const updateKeyframeProperty = (id: string, propKey: string, value: any) => {
    setKeyframes((prev) =>
      prev.map((kf) =>
        kf.id === id
          ? {
              ...kf,
              properties: {
                ...kf.properties,
                [propKey]: value,
              },
            }
          : kf
      )
    );
    setSelectedPreset(null); // Clear preset when manually editing properties
  };

  const removeKeyframeProperty = (id: string, propKey: string) => {
    setKeyframes((prev) =>
      prev.map((kf) => {
        if (kf.id === id) {
          const { [propKey]: removed, ...restProps } = kf.properties;
          return { ...kf, properties: restProps };
        }
        return kf;
      })
    );
    setSelectedPreset(null); // Clear preset when removing properties
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = Math.max(0, Math.min(duration, percent * duration));

    setCurrentTime(time);
  };

  const handleKeyframeClick = (keyframeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKeyframeId(keyframeId);
  };

  const handleKeyframeDrag = (keyframeId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const startX = e.clientX;
    const keyframe = keyframes.find((kf) => kf.id === keyframeId);
    if (!keyframe || !timelineRef.current) return;

    const startTime = keyframe.time;
    const rect = timelineRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = (deltaX / rect.width) * duration;
      const newTime = Math.max(0, Math.min(duration, startTime + deltaTime));

      updateKeyframe(keyframeId, { time: newTime });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= duration) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
    }
  };

  const getInterpolatedStyle = (time: number) => {
    if (keyframes.length === 0) return {};
    if (keyframes.length === 1) return keyframes[0].properties;

    // Find surrounding keyframes
    let beforeKf = keyframes[0];
    let afterKf = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= time && keyframes[i + 1].time >= time) {
        beforeKf = keyframes[i];
        afterKf = keyframes[i + 1];
        break;
      }
    }

    if (time <= keyframes[0].time) return keyframes[0].properties;
    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].properties;
    }

    // Simple linear interpolation for numeric values
    const progress = (time - beforeKf.time) / (afterKf.time - beforeKf.time);
    const interpolated: Record<string, any> = {};

    const allKeys = new Set([
      ...Object.keys(beforeKf.properties),
      ...Object.keys(afterKf.properties),
    ]);

    allKeys.forEach((key) => {
      const beforeVal = beforeKf.properties[key];
      const afterVal = afterKf.properties[key];

      if (typeof beforeVal === "number" && typeof afterVal === "number") {
        interpolated[key] = beforeVal + (afterVal - beforeVal) * progress;
      } else if (key === "color") {
        // For colors, just use the "before" value (no interpolation)
        interpolated[key] = progress < 0.5 ? beforeVal : afterVal;
      } else {
        interpolated[key] = progress < 0.5 ? beforeVal : afterVal;
      }
    });

    return interpolated;
  };

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const previewStyle = getInterpolatedStyle(currentTime);

  // Load animation template
  const loadTemplate = (template: AnimationTemplate) => {
    // Convert template properties to keyframes
    const props = template.config.properties;
    const newKeyframes: Keyframe[] = [];

    // Create start keyframe (initial state) with all properties
    const initialProps: Record<string, any> = {};
    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (Array.isArray(value)) {
        initialProps[key] = value[0];
      } else {
        initialProps[key] = value;
      }
    });

    // Add default properties if not present
    if (!initialProps.opacity && initialProps.opacity !== 0) initialProps.opacity = 1;

    newKeyframes.push({
      id: `kf_${Date.now()}_0`,
      time: 0,
      properties: initialProps,
      transition: { duration: template.duration / 1000, easing: template.config.easing },
    });

    // Create end keyframe (final state) with all properties
    const finalProps: Record<string, any> = {};
    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (Array.isArray(value)) {
        finalProps[key] = value[value.length - 1];
      } else {
        finalProps[key] = value;
      }
    });

    // Ensure final props has same properties as initial for consistency
    Object.keys(initialProps).forEach((key) => {
      if (!(key in finalProps)) {
        finalProps[key] = initialProps[key];
      }
    });

    newKeyframes.push({
      id: `kf_${Date.now()}_1`,
      time: template.duration / 1000,
      properties: finalProps,
      transition: { duration: 1, easing: template.config.easing },
    });

    setKeyframes(newKeyframes);
    setSelectedKeyframeId(newKeyframes[0].id);
    setDuration(Math.max(5, template.duration / 1000 + 2));
    setSelectedPreset(template.name);
    setShowTemplates(false);

    // Update style with keyframes only (remove simple animation to avoid conflicts)
    updateStyle(styleId, {
      keyframes: newKeyframes,
    });
  };

  // Export handlers
  const handleExportCSS = () => {
    if (!style) return;
    const css = exportTimelineCSS(style, style.name.toLowerCase().replace(/\s+/g, "-"));
    downloadFile(css, `${style.name.replace(/\s+/g, "-")}-animation.css`, "text/css");
  };

  const handleExportReact = () => {
    if (!style) return;
    const componentName = style.name.replace(/\s+/g, "");
    const jsx = exportAsReact(style, componentName);
    downloadFile(jsx, `${componentName}.jsx`, "text/javascript");
  };

  const handleExportVideo = () => {
    if (!style) return;
    const metadata = exportAsVideoMetadata(style, previewText);
    downloadFile(
      metadata,
      `${style.name.replace(/\s+/g, "-")}-video-metadata.json`,
      "application/json"
    );
  };

  const handleCopyCSS = () => {
    if (!style) return;
    const css = exportTimelineCSS(style, style.name.toLowerCase().replace(/\s+/g, "-"));
    navigator.clipboard.writeText(css);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    saveCustomAnimationPreset(presetName, presetDescription, keyframes, duration);
    setSelectedPreset(presetName);
    setShowSaveDialog(false);
    setPresetName("");
    setPresetDescription("");
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    deleteCustomAnimationPreset(presetId);
    if (selectedPreset && customAnimationPresets.find(p => p.id === presetId)?.name === selectedPreset) {
      setSelectedPreset(null);
    }
  };

  const loadCustomPreset = (preset: typeof customAnimationPresets[0]) => {
    setKeyframes(preset.keyframes);
    setSelectedKeyframeId(preset.keyframes[0]?.id || null);
    setDuration(preset.duration);
    setSelectedPreset(preset.name);
    setShowTemplates(false);

    // Update style with keyframes
    updateStyle(styleId, {
      keyframes: preset.keyframes,
    });
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Animation Templates */}
      <div className="border rounded-lg p-3 bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-medium">Animation Presets</div>
            <div className="text-[10px] text-muted-foreground">
              Current: {selectedPreset || "None"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  title="Save current animation as preset"
                >
                  <Save className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Save Animation Preset</DialogTitle>
                  <DialogDescription>
                    Save your current animation as a reusable preset with a name and description.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preset-name">Name *</Label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="e.g., Smooth Fade In"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preset-description">Description</Label>
                    <Input
                      id="preset-description"
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="e.g., A gentle fade-in with subtle movement"
                      className="col-span-3"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {keyframes.length} keyframes • {duration}s duration
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                  >
                    Save Preset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTemplates(!showTemplates)}
              className="h-7 text-xs"
            >
              {showTemplates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {showTemplates && (
          <div className="mt-3 max-h-[400px] overflow-y-auto space-y-3">
            {/* Custom Presets */}
            {customAnimationPresets.length > 0 && (
              <div>
                <div className="text-xs font-medium text-primary mb-2">Your Presets</div>
                <div className="space-y-2">
                  {customAnimationPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="w-full rounded-lg border p-2 transition hover:bg-accent/40 flex items-center justify-between"
                    >
                      <button
                        onClick={() => loadCustomPreset(preset)}
                        className="flex-1 text-left"
                      >
                        <div className="text-xs font-medium">{preset.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {preset.description || "No description"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {preset.keyframes.length} keyframes • {preset.duration}s
                        </div>
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomPreset(preset.id);
                        }}
                        className="h-7 w-7 p-0 ml-2"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in Templates */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Built-in Templates</div>
              <div className="space-y-2">
                {ANIMATION_TEMPLATES.slice(0, 12).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="w-full rounded-lg border p-2 text-left transition hover:bg-accent/40 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium">{template.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {template.duration}ms • {template.config.easing}
                      </div>
                    </div>
                    <Badge
                      variant={
                        template.difficulty === "easy"
                          ? "default"
                          : template.difficulty === "medium"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] ml-2"
                    >
                      {template.difficulty}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Playback Controls */}
      <div className="border rounded-lg p-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {currentTime.toFixed(2)}s
            </span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {duration}s
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Label className="text-xs">Duration:</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseFloat(e.target.value) || 10))}
              className="w-16 h-7 text-xs"
              min={1}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="border rounded-lg p-3 bg-muted/20">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Export Animation
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSS}
            className="h-9 justify-start gap-2"
          >
            <Download className="h-3 w-3" />
            <span className="text-xs">CSS @keyframes</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCSS}
            className="h-9 justify-start gap-2"
          >
            <Code2 className="h-3 w-3" />
            <span className="text-xs">Copy CSS</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportReact}
            className="h-9 justify-start gap-2"
          >
            <FileCode className="h-3 w-3" />
            <span className="text-xs">React JSX</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportVideo}
            className="h-9 justify-start gap-2"
          >
            <Video className="h-3 w-3" />
            <span className="text-xs">Video JSON</span>
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="border rounded-lg p-3 bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium">Timeline</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addKeyframe()}
            className="h-7"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Keyframe
          </Button>
        </div>

        <div
          ref={timelineRef}
          className="relative h-16 bg-background rounded border cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: duration + 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-muted-foreground/20"
                style={{ borderRightWidth: i === duration ? 0 : 1 }}
              >
                <div className="text-[9px] text-muted-foreground px-1">
                  {i}s
                </div>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
          </div>

          {/* Keyframes */}
          {keyframes.map((kf) => (
            <div
              key={kf.id}
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full cursor-move z-20 ${
                selectedKeyframeId === kf.id
                  ? "bg-primary ring-2 ring-primary ring-offset-2"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              style={{ left: `${(kf.time / duration) * 100}%`, marginLeft: "-8px" }}
              onClick={(e) => handleKeyframeClick(kf.id, e)}
              onMouseDown={(e) => handleKeyframeDrag(kf.id, e)}
            />
          ))}
        </div>
      </div>

      {/* Keyframe Properties */}
      {selectedKeyframe && (
        <div className="border rounded-lg p-4 bg-muted/20 flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">
                Keyframe at {selectedKeyframe.time.toFixed(2)}s
              </div>
              <div className="text-xs text-muted-foreground">
                {Object.keys(selectedKeyframe.properties).length} properties
              </div>
            </div>
            {keyframes.length > 1 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeKeyframe(selectedKeyframe.id)}
                className="h-7"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Separator className="my-3" />

          {/* Transition Settings */}
          <div className="space-y-3 mb-4">
            <div className="text-xs font-medium">Transition</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Duration (s)</Label>
                <Input
                  type="number"
                  value={selectedKeyframe.transition?.duration || 1}
                  onChange={(e) =>
                    updateKeyframe(selectedKeyframe.id, {
                      transition: {
                        ...selectedKeyframe.transition,
                        duration: parseFloat(e.target.value) || 1,
                        easing: selectedKeyframe.transition?.easing || "ease-out",
                      },
                    })
                  }
                  className="h-8 text-xs"
                  min={0.1}
                  step={0.1}
                />
              </div>
              <div>
                <Label className="text-xs">Easing</Label>
                <select
                  value={selectedKeyframe.transition?.easing || "ease-out"}
                  onChange={(e) =>
                    updateKeyframe(selectedKeyframe.id, {
                      transition: {
                        ...selectedKeyframe.transition,
                        duration: selectedKeyframe.transition?.duration || 1,
                        easing: e.target.value,
                      },
                    })
                  }
                  className="w-full h-8 text-xs border rounded-md bg-background px-2"
                >
                  {EASING_OPTIONS.map((easing) => (
                    <option key={easing} value={easing}>
                      {easing}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Properties */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">Properties</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPropertyAdd(!showPropertyAdd)}
                className="h-6 text-xs"
              >
                {showPropertyAdd ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Add Property */}
            {showPropertyAdd && (
              <div className="grid grid-cols-2 gap-2 p-2 border rounded bg-background/50">
                {COMMON_PROPERTIES.filter(
                  (prop) => !(prop.key in selectedKeyframe.properties)
                ).map((prop) => (
                  <Button
                    key={prop.key}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateKeyframeProperty(
                        selectedKeyframe.id,
                        prop.key,
                        prop.type === "color" ? "#000000" : 0
                      );
                    }}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {prop.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Current Properties */}
            <div className="space-y-2">
              {Object.entries(selectedKeyframe.properties).map(([key, value]) => {
                const propDef = COMMON_PROPERTIES.find((p) => p.key === key);

                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs capitalize">{propDef?.label || key}</Label>
                      <Input
                        type={propDef?.type || "text"}
                        value={value}
                        onChange={(e) =>
                          updateKeyframeProperty(
                            selectedKeyframe.id,
                            key,
                            propDef?.type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          )
                        }
                        className="h-8 text-xs"
                        min={propDef?.min}
                        max={propDef?.max}
                        step={propDef?.step}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeKeyframeProperty(selectedKeyframe.id, key)}
                      className="h-8 w-8 p-0 mt-4"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineEditor;
