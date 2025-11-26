"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  ArrowRight,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
  Globe,
  Search,
  Palette,
  Code,
  Check,
} from "lucide-react";
import { type TypographyAISuggestion } from "@/services/ai/typography-ai";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface FunctionCall {
  name: string;
  description: string;
  result: string;
  icon: React.ReactNode;
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: TypographyAISuggestion[];
  functionCalls?: FunctionCall[];
  timestamp: Date;
}

interface AITypographyChatModernProps {
  onApplySuggestion?: (suggestion: TypographyAISuggestion) => void;
}

export default function AITypographyChatModern({ onApplySuggestion }: AITypographyChatModernProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hello! I'm your AI Typography Designer.\n\nI'll analyze your request and use real functions to search trends, evaluate fonts, and generate perfect typography.\n\nWhat do you need?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeFunctions, setActiveFunctions] = useState<FunctionCall[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeFunctions]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!user) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Please log in to use the AI assistant.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);
    setActiveFunctions([]);

    // Create a temporary assistant message to show streaming updates
    const assistantMessageId = (Date.now() + 1).toString();
    const tempAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      suggestions: [],
      functionCalls: [],
    };
    setMessages((prev) => [...prev, tempAssistantMessage]);

    try {
      // Build conversation history for context memory
      const conversationHistory = messages
        .filter((msg) => msg.id !== "welcome") // Exclude welcome message
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Use SSE streaming for real-time updates
      const response = await fetch("http://localhost:8000/typography-ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userInput,
          user_id: user.id,
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let buffer = "";
      let currentContent = "";
      let currentFunctions: FunctionCall[] = [];
      let currentSuggestions: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              if (event.type === "status") {
                // Show status as temporary content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: `⏳ ${event.message}` }
                      : msg
                  )
                );
              } else if (event.type === "thinking_start") {
                currentContent = "🤔 Thinking...";
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: currentContent }
                      : msg
                  )
                );
              } else if (event.type === "text_delta") {
                currentContent += event.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: currentContent }
                      : msg
                  )
                );
              } else if (event.type === "tool_start") {
                const newFunction: FunctionCall = {
                  name: event.tool,
                  description: event.message,
                  result: "Processing...",
                  icon: getIconForFunction(event.tool),
                  timestamp: new Date(),
                };
                currentFunctions.push(newFunction);
                setActiveFunctions(currentFunctions);
              } else if (event.type === "tool_call") {
                // Update function result
                const funcIndex = currentFunctions.findIndex(
                  (f) => f.name === event.tool
                );
                if (funcIndex >= 0) {
                  currentFunctions[funcIndex].result = JSON.stringify(event.input);
                  setActiveFunctions([...currentFunctions]);
                }
              } else if (event.type === "design_generated") {
                currentSuggestions.push(event.design);
                await loadFontDynamically(event.design.font_family);
              } else if (event.type === "final") {
                // Update with final data
                const finalFunctions: FunctionCall[] = event.function_calls.map(
                  (fc: any) => ({
                    name: fc.tool,
                    description: `${fc.tool} executed`,
                    result: "Completed",
                    icon: getIconForFunction(fc.tool),
                    timestamp: new Date(fc.timestamp),
                  })
                );

                // Load all fonts
                for (const suggestion of event.suggestions) {
                  await loadFontDynamically(suggestion.fontFamily);
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content:
                            event.conversational_response ||
                            `Generated ${event.suggestions.length} design(s)`,
                          suggestions: event.suggestions,
                          functionCalls: finalFunctions,
                        }
                      : msg
                  )
                );
                setActiveFunctions([]);
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "⚠️ I encountered an error. Please check your connection or try again.",
              }
            : msg
        )
      );
      setActiveFunctions([]);
    } finally {
      setLoading(false);
    }
  };

  const getIconForFunction = (name: string) => {
    switch (name) {
      case "searchWeb":
        return <Globe className="h-4 w-4" />;
      case "analyzeFonts":
        return <Search className="h-4 w-4" />;
      case "evaluateContrast":
        return <Palette className="h-4 w-4" />;
      case "generateTypographyDesign":
        return <Code className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const loadFontDynamically = async (fontFamily: string) => {
    const cleanFont = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      cleanFont
    )}:wght@300;400;500;600;700;800&display=swap`;

    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) return;

    const link = document.createElement("link");
    link.href = fontUrl;
    link.rel = "stylesheet";
    document.head.appendChild(link);
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
    if (lower.includes("modern") || lower.includes("futuristic")) return "modern";
    if (lower.includes("elegant")) return "elegant";
    if (lower.includes("playful")) return "playful";
    if (lower.includes("professional")) return "professional";
    if (lower.includes("minimal")) return "minimalist";
    if (lower.includes("bold")) return "bold";
    if (lower.includes("vintage")) return "vintage";
    return "modern";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-foreground/5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Typography Designer</h2>
            <p className="text-xs text-muted-foreground">
              Real Function Calling • Web Search • Smart Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area - Threaded */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onApplySuggestion={onApplySuggestion}
            />
          ))}

          {/* Active Function Calls */}
          {activeFunctions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 rounded-lg border bg-card p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calling Functions
                  </div>
                  <div className="space-y-2">
                    {activeFunctions.map((func, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded bg-muted/50 border"
                      >
                        <div className="flex-shrink-0 p-1.5 rounded bg-background">
                          {func.result ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            func.icon
                          )}
                        </div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{func.name}()</div>
                          <div className="text-muted-foreground mt-0.5">
                            {func.description}
                          </div>
                          {func.result && (
                            <div className="mt-2 p-2 rounded bg-background text-xs">
                              ✓ {func.result}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Describe your typography design..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Working
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Try: "Modern website heading" • "Elegant logo text"
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
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
      )}

      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser ? "bg-foreground text-background" : "bg-card border"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>

          {/* Function Calls - Expandable */}
          {message.functionCalls && message.functionCalls.length > 0 && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-3 py-2 bg-muted/50 flex items-center justify-between text-sm font-medium hover:bg-muted transition-colors"
              >
                <span>Functions Called ({message.functionCalls.length})</span>
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expanded && (
                <div className="p-3 space-y-2 bg-background">
                  {message.functionCalls.map((func, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2 rounded bg-muted/30"
                    >
                      <div className="flex-shrink-0 p-1.5 rounded bg-background">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="font-medium">{func.name}()</div>
                        <div className="text-muted-foreground mt-0.5">
                          {func.description}
                        </div>
                        <div className="mt-1.5 p-1.5 rounded bg-background">
                          ✓ {func.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Typography Suggestions */}
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
          <div
            className={`mt-3 text-xs flex items-center gap-1 ${
              isUser ? "text-background/60" : "text-muted-foreground"
            }`}
          >
            <Eye className="h-3 w-3" />
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <User className="h-5 w-5" />
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
    <div className="p-4 rounded-lg border bg-background space-y-4">
      {/* Preview */}
      <div
        className="p-8 rounded-lg bg-muted flex items-center justify-center"
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
          <div className="mb-2">The quick brown fox</div>
          <div className="text-sm opacity-60 font-normal">
            {suggestion.fontFamily.split(",")[0]}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: "Font", value: suggestion.fontFamily.split(",")[0] },
          { label: "Size", value: suggestion.fontSize },
          { label: "Weight", value: suggestion.fontWeight.toString() },
          { label: "Spacing", value: suggestion.letterSpacing },
        ].map((item, idx) => (
          <div key={idx} className="p-2 rounded bg-muted">
            <div className="text-muted-foreground mb-0.5">{item.label}</div>
            <div className="font-medium truncate">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      <div className="p-3 rounded bg-muted text-xs">
        <div className="flex items-start gap-2">
          <Zap className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Why this works: </span>
            <span className="text-muted-foreground">{suggestion.reasoning}</span>
          </div>
        </div>
      </div>

      {/* Apply Button */}
      {onApply && (
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => onApply(suggestion)}
        >
          <Zap className="h-3.5 w-3.5" />
          Apply to Canvas
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
