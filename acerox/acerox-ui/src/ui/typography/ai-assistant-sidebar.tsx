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
  Check,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useTypography } from "@/state/typography";
import type { TypographyAISuggestion } from "@/services/ai/typography-ai";

interface FunctionCall {
  name: string;
  description: string;
  result: string;
  status: "pending" | "executing" | "completed" | "error";
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  functionCalls?: FunctionCall[];
  timestamp: Date;
}

interface AIAssistantSidebarProps {
  onApplySuggestion?: (_suggestion: TypographyAISuggestion) => void;
}

export default function AIAssistantSidebar({ onApplySuggestion }: AIAssistantSidebarProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: "AI Typography Assistant Ready\n\nI can modify your typography directly through function calls. Try:\n• 'Make the heading bolder'\n• 'Add a fade-in animation'\n• 'Increase letter spacing'",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typography state access
  const selectedStyleId = useTypography((s) => s.selectedStyleId);
  const styles = useTypography((s) => s.styles);
  const updateStyle = useTypography((s) => s.updateStyle);
  const createStyle = useTypography((s) => s.createStyle);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function calling system - actually modifies the UI
  const executeFunctionCall = async (functionName: string, params: Record<string, unknown>) => {
    switch (functionName) {
      case "updateTypography":
        if (selectedStyleId) {
          updateStyle(selectedStyleId, params);
          return `Updated ${Object.keys(params).join(", ")}`;
        }
        return "No style selected";

      case "createStyle":
        const newStyle = createStyle(params);
        return `Created new style: ${params.name}`;

      case "adjustFontWeight":
        if (selectedStyleId) {
          updateStyle(selectedStyleId, { fontWeight: params.weight });
          return `Set font weight to ${params.weight}`;
        }
        return "No style selected";

      case "applyAnimation":
        if (selectedStyleId) {
          updateStyle(selectedStyleId, {
            animation: {
              type: params.type,
              duration: params.duration || 1000,
              delay: params.delay || 0,
              easing: params.easing || "ease-in-out",
              direction: params.direction || "up",
            },
          });
          return `Applied ${params.type} animation`;
        }
        return "No style selected";

      case "adjustSpacing":
        if (selectedStyleId) {
          const updates: any = {};
          if (params.letterSpacing) updates.letterSpacing = params.letterSpacing;
          if (params.lineHeight) updates.lineHeight = params.lineHeight;
          updateStyle(selectedStyleId, updates);
          return `Updated spacing`;
        }
        return "No style selected";

      case "changeColor":
        if (selectedStyleId) {
          updateStyle(selectedStyleId, { color: params.color });
          return `Changed color to ${params.color}`;
        }
        return "No style selected";

      default:
        return `Unknown function: ${functionName}`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!user) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Please log in to use the AI assistant.",
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

    try {
      // Call AI backend with function calling enabled
      const response = await fetch("http://localhost:8000/typography-ai/function-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userInput,
          user_id: user.id,
          current_style: selectedStyleId ? styles[selectedStyleId] : null,
          available_functions: [
            "updateTypography",
            "createStyle",
            "adjustFontWeight",
            "applyAnimation",
            "adjustSpacing",
            "changeColor",
          ],
        }),
      });

      const data = await response.json();

      // Execute function calls
      const functionCalls: FunctionCall[] = [];
      if (data.function_calls && Array.isArray(data.function_calls)) {
        for (const call of data.function_calls) {
          const funcCall: FunctionCall = {
            name: call.function,
            description: call.reasoning || `Calling ${call.function}`,
            result: "",
            status: "executing",
            timestamp: new Date(),
          };
          functionCalls.push(funcCall);

          try {
            // Actually execute the function
            const result = await executeFunctionCall(call.function, call.parameters);
            funcCall.result = result;
            funcCall.status = "completed";
          } catch (error) {
            funcCall.result = `Error: ${error}`;
            funcCall.status = "error";
          }
        }
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Done!",
        functionCalls,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Failed to process request. Using local interpretation...",
        timestamp: new Date(),
      };

      // Fallback: local interpretation
      const localFunctions = interpretLocally(userInput);
      errorMessage.functionCalls = localFunctions;

      // Execute local functions
      for (const func of localFunctions) {
        try {
          const result = await executeFunctionCall(func.name, JSON.parse(func.result));
          func.status = "completed";
          func.result = result;
        } catch (e) {
          func.status = "error";
        }
      }

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Local interpretation as fallback
  const interpretLocally = (input: string): FunctionCall[] => {
    const functions: FunctionCall[] = [];
    const lower = input.toLowerCase();

    if (lower.includes("bold") || lower.includes("weight")) {
      const weight = lower.includes("lighter") ? 300 : lower.includes("bolder") ? 700 : 600;
      functions.push({
        name: "adjustFontWeight",
        description: "Adjusting font weight",
        result: JSON.stringify({ weight }),
        status: "pending",
        timestamp: new Date(),
      });
    }

    if (lower.includes("animation") || lower.includes("animate") || lower.includes("fade")) {
      const type = lower.includes("fade") ? "fadeIn" : "slideUp";
      functions.push({
        name: "applyAnimation",
        description: "Adding animation",
        result: JSON.stringify({ type, duration: 800, easing: "ease-out" }),
        status: "pending",
        timestamp: new Date(),
      });
    }

    if (lower.includes("spacing") || lower.includes("letter-spacing")) {
      functions.push({
        name: "adjustSpacing",
        description: "Adjusting spacing",
        result: JSON.stringify({ letterSpacing: "0.05em" }),
        status: "pending",
        timestamp: new Date(),
      });
    }

    if (lower.includes("color") && lower.match(/#[0-9a-f]{6}/i)) {
      const color = lower.match(/#[0-9a-f]{6}/i)?.[0];
      functions.push({
        name: "changeColor",
        description: "Changing color",
        result: JSON.stringify({ color }),
        status: "pending",
        timestamp: new Date(),
      });
    }

    return functions;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Function calling enabled</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Make it bolder..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          AI will modify your typography directly
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-2 ${isUser ? "justify-end" : ""}`}
    >
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isSystem ? "bg-muted" : "bg-primary/10"
        }`}>
          {isSystem ? <Zap className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
        </div>
      )}

      <div className={`flex-1 max-w-xs ${isUser ? "flex justify-end" : ""}`}>
        <div
          className={`rounded-lg p-3 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : isSystem
              ? "bg-muted border"
              : "bg-card border"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Function Calls */}
          {message.functionCalls && message.functionCalls.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-semibold opacity-70">Functions Executed:</div>
              {message.functionCalls.map((func, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-background/50 text-xs"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {func.status === "completed" ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : func.status === "executing" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : func.status === "error" ? (
                      <span className="text-red-600">✗</span>
                    ) : (
                      <span className="opacity-50">○</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{func.name}()</div>
                    <div className="text-muted-foreground mt-0.5">{func.description}</div>
                    {func.result && (
                      <div className="mt-1 p-1.5 rounded bg-background text-[10px] font-mono">
                        {func.result}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 text-xs opacity-60">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
