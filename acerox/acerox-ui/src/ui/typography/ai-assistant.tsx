"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { askTypographyAI, type TypographyAISuggestion } from "@/services/ai/typography-ai";

interface AIAssistantProps {
  onApplySuggestion?: (suggestion: TypographyAISuggestion) => void;
}

export default function AITypographyAssistant({ onApplySuggestion }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState("logo");
  const [style, setStyle] = useState("modern");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TypographyAISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAskAI = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await askTypographyAI({
        prompt,
        context: {
          projectType,
          style,
        },
      });

      if (result.length === 0) {
        setError("No suggestions received from AI. Please try again.");
      } else {
        setSuggestions(result);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setError("Failed to get AI suggestions. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Typography Assistant
          </CardTitle>
          <CardDescription>
            Ask Claude to suggest typography for your design
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">What do you need?</Label>
            <textarea
              id="ai-prompt"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., I want a modern font for my tech startup logo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="project-type">Project Type</Label>
            <select
              id="project-type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
            >
              <option value="logo">Logo</option>
              <option value="website">Website</option>
              <option value="app">App</option>
              <option value="poster">Poster</option>
              <option value="social">Social Media</option>
            </select>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style">Desired Style</Label>
            <select
              id="style"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="modern">Modern</option>
              <option value="elegant">Elegant</option>
              <option value="playful">Playful</option>
              <option value="professional">Professional</option>
              <option value="minimalist">Minimalist</option>
              <option value="bold">Bold</option>
              <option value="vintage">Vintage</option>
            </select>
          </div>

          {/* Ask Button */}
          <Button
            onClick={handleAskAI}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Ask Claude
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">AI Suggestions</h3>
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                {/* Preview */}
                <div
                  className="p-6 rounded-md bg-muted flex items-center justify-center"
                  style={{
                    fontFamily: suggestion.fontFamily,
                    fontSize: suggestion.fontSize,
                    fontWeight: suggestion.fontWeight,
                    lineHeight: suggestion.lineHeight,
                    letterSpacing: suggestion.letterSpacing,
                    color: suggestion.color,
                  }}
                >
                  <div className="text-center">
                    <div>The quick brown fox</div>
                    <div className="opacity-70 text-sm mt-1">
                      {suggestion.fontFamily}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Font:</span>{" "}
                    <span className="font-medium">{suggestion.fontFamily}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>{" "}
                    <span className="font-medium">{suggestion.fontSize}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weight:</span>{" "}
                    <span className="font-medium">{suggestion.fontWeight}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Spacing:</span>{" "}
                    <span className="font-medium">{suggestion.letterSpacing}</span>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="text-xs text-muted-foreground bg-muted/50 border border-border p-3 rounded-md">
                  <span className="font-medium text-foreground">Why this works: </span>
                  {suggestion.reasoning}
                </div>

                {/* Apply Button */}
                {onApplySuggestion && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onApplySuggestion(suggestion)}
                  >
                    Apply This Style
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
