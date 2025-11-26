"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, User, Bot, ArrowRight, Zap } from "lucide-react";
import { askTypographyAI, type TypographyAISuggestion } from "@/services/ai/typography-ai";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: TypographyAISuggestion[];
  thinking?: string[];
  timestamp: Date;
}

interface AITypographyChatProps {
  onApplySuggestion?: (suggestion: TypographyAISuggestion) => void;
}

export default function AITypographyChat({ onApplySuggestion }: AITypographyChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Typography Designer. I can help you create beautiful text designs with advanced CSS, animations, colors, and effects. Just describe what you want!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setThinking([]);

    // Simulate thinking process
    const thinkingSteps = [
      "🔍 Analyzing your request...",
      "🎨 Researching design trends...",
      "⚡ Evaluating font pairings...",
      "🌈 Calculating color harmony...",
      "✨ Generating CSS suggestions...",
    ];

    for (let i = 0; i < thinkingSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setThinking((prev) => [...prev, thinkingSteps[i]]);
    }

    try {
      // Extract context from the message
      const projectType = detectProjectType(input);
      const style = detectStyle(input);

      const result = await askTypographyAI({
        prompt: input,
        context: {
          projectType,
          style,
        },
      });

      setThinking((prev) => [...prev, "✅ Design complete!"]);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I've created ${result.length} typography ${result.length === 1 ? "design" : "designs"} based on your request. Each includes custom CSS and can be further customized!`,
        suggestions: result,
        thinking: [...thinking],
        timestamp: new Date(),
      };

      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessages((prev) => [...prev, assistantMessage]);
      setThinking([]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please check your API key and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setThinking([]);
    } finally {
      setLoading(false);
    }
  };

  const detectProjectType = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes("logo")) return "logo";
    if (lower.includes("website") || lower.includes("web")) return "website";
    if (lower.includes("app")) return "app";
    if (lower.includes("poster")) return "poster";
    if (lower.includes("social")) return "social";
    return "logo";
  };

  const detectStyle = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes("modern")) return "modern";
    if (lower.includes("elegant")) return "elegant";
    if (lower.includes("playful")) return "playful";
    if (lower.includes("professional")) return "professional";
    if (lower.includes("minimalist") || lower.includes("minimal")) return "minimalist";
    if (lower.includes("bold")) return "bold";
    if (lower.includes("vintage")) return "vintage";
    return "modern";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Typography Designer</h2>
            <p className="text-sm text-muted-foreground">
              Advanced CSS • Animations • Colors • Effects
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onApplySuggestion={onApplySuggestion}
            />
          ))}

          {/* Thinking Indicator */}
          {thinking.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinking...
                    </div>
                    <div className="space-y-1">
                      {thinking.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-muted-foreground"
                        >
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your typography design... (e.g., modern logo with gradient)"
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Try: "Bold heading with gradient", "Elegant logo with shadow", "Animated text"
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onApplySuggestion,
}: {
  message: Message;
  onApplySuggestion?: (suggestion: TypographyAISuggestion) => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        <Card className={isUser ? "bg-primary text-primary-foreground" : ""}>
          <CardContent className="p-4">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    onApply={onApplySuggestion}
                  />
                ))}
              </div>
            )}

            {/* Timestamp */}
            <div className={`mt-2 text-xs ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: TypographyAISuggestion;
  onApply?: (suggestion: TypographyAISuggestion) => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
      {/* Preview */}
      <div
        className="p-6 rounded-md bg-background flex items-center justify-center"
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
          <div className="opacity-70 text-sm mt-1">{suggestion.fontFamily}</div>
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
          <span className="text-muted-foreground">Color:</span>{" "}
          <span className="font-medium">{suggestion.color}</span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="text-xs text-muted-foreground bg-background/50 border border-border p-2 rounded">
        <span className="font-medium text-foreground">💡 </span>
        {suggestion.reasoning}
      </div>

      {/* Apply Button */}
      {onApply && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => onApply(suggestion)}
        >
          <Zap className="mr-2 h-3 w-3" />
          Apply to Canvas
        </Button>
      )}
    </div>
  );
}
