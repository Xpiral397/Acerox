"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface Gradient {
  enabled: boolean;
  type: "linear" | "radial" | "conic";
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

interface GradientEditorProps {
  gradient?: Gradient;
  onChange: (gradient: Gradient) => void;
}

export function GradientEditor({ gradient, onChange }: GradientEditorProps) {
  const currentGradient = gradient || {
    enabled: false,
    type: "linear" as const,
    angle: 90,
    stops: [
      { color: "#ff0000", position: 0 },
      { color: "#0000ff", position: 100 },
    ],
  };

  const handleEnabledChange = (enabled: boolean) => {
    onChange({ ...currentGradient, enabled });
  };

  const handleTypeChange = (type: "linear" | "radial" | "conic") => {
    onChange({ ...currentGradient, type });
  };

  const handleAngleChange = (angle: number) => {
    onChange({ ...currentGradient, angle });
  };

  const handleStopColorChange = (index: number, color: string) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = { ...newStops[index], color };
    onChange({ ...currentGradient, stops: newStops });
  };

  const handleStopPositionChange = (index: number, position: number) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = { ...newStops[index], position };
    onChange({ ...currentGradient, stops: newStops });
  };

  const handleAddStop = () => {
    const newStops = [
      ...currentGradient.stops,
      { color: "#00ff00", position: 50 },
    ];
    onChange({ ...currentGradient, stops: newStops });
  };

  const handleRemoveStop = (index: number) => {
    if (currentGradient.stops.length <= 2) return; // Need at least 2 stops
    const newStops = currentGradient.stops.filter((_, i) => i !== index);
    onChange({ ...currentGradient, stops: newStops });
  };

  return (
    <div className="space-y-3">
      {/* Enable Gradient */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Enable Gradient</Label>
        <Switch
          checked={currentGradient.enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {currentGradient.enabled && (
        <>
          <Separator />

          {/* Gradient Type */}
          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["linear", "radial", "conic"] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={currentGradient.type === type ? "default" : "outline"}
                  onClick={() => handleTypeChange(type)}
                  className="capitalize text-xs"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Angle (for linear and conic) */}
          {(currentGradient.type === "linear" || currentGradient.type === "conic") && (
            <div className="space-y-2">
              <Label className="text-xs">Angle: {currentGradient.angle}°</Label>
              <Input
                type="range"
                min="0"
                max="360"
                value={currentGradient.angle}
                onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                className="h-9"
              />
            </div>
          )}

          <Separator />

          {/* Color Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Color Stops</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddStop}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2">
              {currentGradient.stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleStopColorChange(index, e.target.value)}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={stop.position}
                    onChange={(e) =>
                      handleStopPositionChange(index, parseInt(e.target.value) || 0)
                    }
                    className="h-8 flex-1 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  {currentGradient.stops.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveStop(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs">Preview</Label>
            <div
              className="h-16 rounded border"
              style={{
                background: getGradientCSS(currentGradient),
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to generate CSS gradient string
function getGradientCSS(gradient: Gradient): string {
  const stops = gradient.stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");

  if (gradient.type === "linear") {
    return `linear-gradient(${gradient.angle}deg, ${stops})`;
  } else if (gradient.type === "radial") {
    return `radial-gradient(circle, ${stops})`;
  } else {
    return `conic-gradient(from ${gradient.angle}deg, ${stops})`;
  }
}

export default GradientEditor;
