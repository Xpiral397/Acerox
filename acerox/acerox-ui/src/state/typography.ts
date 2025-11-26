// Typography system state management
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TypographyStyle {
  id: string;
  name: string; // e.g., "NavbarText", "Hero Heading", "Body Text"

  // Font properties
  fontFamily: string;
  fontSize: string; // e.g., "16px", "1.5rem"
  fontWeight: number | string; // 400, 700, "bold"
  lineHeight: string; // e.g., "1.5", "24px"
  letterSpacing: string; // e.g., "0.5px", "0.02em"

  // Style properties
  color: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: string;
  fontStyle?: "normal" | "italic";

  // Gradient properties
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial" | "conic";
    angle: number; // degrees
    stops: Array<{
      color: string;
      position: number; // 0-100
    }>;
  };

  // Advanced
  textShadow?: string;
  wordSpacing?: string;
  whiteSpace?: string;

  // Custom CSS
  customCSS?: string;
  customCSSProperties?: Record<string, string>; // Key-value pairs for custom CSS

  // Animation
  animation?: {
    type?: string;
    duration?: number;
    delay?: number;
    easing?: string;
    direction?: string;
    properties?: Record<string, any>; // Animation property values (opacity, translateX, etc.)
  };

  // 3D Effects
  transform3D?: {
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    translateZ?: number;
    perspective?: number;
    intensity?: number;
  };

  // Timeline keyframes (video-editing style)
  keyframes?: Array<{
    id: string;
    time: number; // seconds
    properties: Record<string, any>; // any CSS property (color, opacity, scale, rotate, etc.)
    transition?: {
      duration: number;
      easing: string;
    };
  }>;

  // Metadata
  category?: "heading" | "body" | "display" | "code" | "custom";
  tags?: string[];
  preview?: string; // Preview text

  // Source
  fontSource?: "google" | "system" | "custom" | "upload";
  fontUrl?: string;
}

export interface FontPlugin {
  id: string;
  name: string;
  type: "google-fonts" | "adobe-fonts" | "custom";
  enabled: boolean;
  apiKey?: string;
}

export interface CustomAnimationPreset {
  id: string;
  name: string;
  description: string;
  keyframes: Array<{
    id: string;
    time: number;
    properties: Record<string, any>;
    transition?: {
      duration: number;
      easing: string;
    };
  }>;
  duration: number;
  createdAt: number;
}

interface TypographyState {
  // Typography styles
  styles: Record<string, TypographyStyle>;
  selectedStyleId: string | null;

  // Plugins
  plugins: FontPlugin[];

  // Custom animation presets
  customAnimationPresets: CustomAnimationPreset[];

  // AI assistant
  aiSuggestions: TypographyStyle[];
  aiPrompt: string;

  // Preview
  previewText: string;

  // Actions
  createStyle: (style: Omit<TypographyStyle, "id">) => string;
  updateStyle: (id: string, updates: Partial<TypographyStyle>) => void;
  deleteStyle: (id: string) => void;
  duplicateStyle: (id: string) => string;
  selectStyle: (id: string | null) => void;

  // Plugin actions
  addPlugin: (plugin: FontPlugin) => void;
  togglePlugin: (id: string) => void;

  // Custom animation preset actions
  saveCustomAnimationPreset: (
    name: string,
    description: string,
    keyframes: CustomAnimationPreset["keyframes"],
    duration: number
  ) => string;
  deleteCustomAnimationPreset: (id: string) => void;

  // AI actions
  setAIPrompt: (prompt: string) => void;
  generateAISuggestions: () => Promise<void>;

  // Preview
  setPreviewText: (text: string) => void;

  // Export
  exportAsCSS: () => string;
  exportAsTokens: () => Record<string, any>;
}

const defaultPreviewText = "The quick brown fox jumps over the lazy dog";

// Storage migration - clear old Map-based data
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("acerox-typography");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.styles && !Array.isArray(parsed.state.styles)) {
        const styles = parsed.state.styles;
        if (Object.keys(styles).length === 0 || styles.constructor !== Object) {
          console.log("Clearing old typography data format");
          localStorage.removeItem("acerox-typography");
        }
      }
    }
  } catch (e) {
    console.error("Error migrating typography storage:", e);
    localStorage.removeItem("acerox-typography");
  }
}

export const useTypography = create<TypographyState>()(
  persist(
    (set, get) => ({
      styles: {},
      selectedStyleId: null,
      plugins: [
        {
          id: "google-fonts",
          name: "Google Fonts",
          type: "google-fonts",
          enabled: true,
        },
      ],
      customAnimationPresets: [],
      aiSuggestions: [],
      aiPrompt: "",
      previewText: defaultPreviewText,

      // Create style
      createStyle: (style) => {
        const id = `typo_${Date.now()}`;
        const newStyle: TypographyStyle = {
          ...style,
          id,
        };

        set((state) => ({
          styles: {
            ...state.styles,
            [id]: newStyle,
          },
          selectedStyleId: id,
        }));

        return id;
      },

      // Update style
      updateStyle: (id, updates) => {
        set((state) => {
          const style = state.styles[id];
          if (!style) return state;

          return {
            styles: {
              ...state.styles,
              [id]: { ...style, ...updates },
            },
          };
        });
      },

      // Delete style
      deleteStyle: (id) => {
        set((state) => {
          const { [id]: removed, ...restStyles } = state.styles;
          return {
            styles: restStyles,
            selectedStyleId: state.selectedStyleId === id ? null : state.selectedStyleId,
          };
        });
      },

      // Duplicate style
      duplicateStyle: (id) => {
        const style = get().styles[id];
        if (!style) return "";

        const newId = `typo_${Date.now()}`;
        const newStyle: TypographyStyle = {
          ...style,
          id: newId,
          name: `${style.name} (Copy)`,
        };

        set((state) => ({
          styles: {
            ...state.styles,
            [newId]: newStyle,
          },
        }));

        return newId;
      },

      // Select style
      selectStyle: (id) => {
        set({ selectedStyleId: id });
      },

      // Add plugin
      addPlugin: (plugin) => {
        set((state) => ({
          plugins: [...state.plugins, plugin],
        }));
      },

      // Toggle plugin
      togglePlugin: (id) => {
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          ),
        }));
      },

      // Save custom animation preset
      saveCustomAnimationPreset: (name, description, keyframes, duration) => {
        const id = `custom_preset_${Date.now()}`;
        const newPreset: CustomAnimationPreset = {
          id,
          name,
          description,
          keyframes,
          duration,
          createdAt: Date.now(),
        };

        set((state) => ({
          customAnimationPresets: [...state.customAnimationPresets, newPreset],
        }));

        return id;
      },

      // Delete custom animation preset
      deleteCustomAnimationPreset: (id) => {
        set((state) => ({
          customAnimationPresets: state.customAnimationPresets.filter(
            (preset) => preset.id !== id
          ),
        }));
      },

      // Set AI prompt
      setAIPrompt: (prompt) => {
        set({ aiPrompt: prompt });
      },

      // Generate AI suggestions
      generateAISuggestions: async () => {
        const prompt = get().aiPrompt;

        // TODO: Integrate with AI API
        // For now, return mock suggestions
        const mockSuggestions: TypographyStyle[] = [
          {
            id: "suggestion_1",
            name: "Modern Sans",
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "1.5",
            letterSpacing: "0",
            color: "#1a1a1a",
            category: "body",
            fontSource: "google",
          },
          {
            id: "suggestion_2",
            name: "Bold Heading",
            fontFamily: "Poppins, sans-serif",
            fontSize: "32px",
            fontWeight: 700,
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            color: "#000000",
            category: "heading",
            fontSource: "google",
          },
        ];

        set({ aiSuggestions: mockSuggestions });
      },

      // Set preview text
      setPreviewText: (text) => {
        set({ previewText: text });
      },

      // Export as CSS
      exportAsCSS: () => {
        const styles = Object.values(get().styles);
        return styles
          .map((style) => {
            const className = style.name.toLowerCase().replace(/\s+/g, "-");
            return `.${className} {
  font-family: ${style.fontFamily};
  font-size: ${style.fontSize};
  font-weight: ${style.fontWeight};
  line-height: ${style.lineHeight};
  letter-spacing: ${style.letterSpacing};
  color: ${style.color};
  ${style.textTransform ? `text-transform: ${style.textTransform};` : ""}
  ${style.customCSS || ""}
}`;
          })
          .join("\n\n");
      },

      // Export as design tokens
      exportAsTokens: () => {
        const styles = Object.values(get().styles);
        const tokens: Record<string, any> = {};

        styles.forEach((style) => {
          const key = style.name.toLowerCase().replace(/\s+/g, "-");
          tokens[key] = {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            color: style.color,
          };
        });

        return tokens;
      },
    }),
    {
      name: "acerox-typography",
    }
  )
);
