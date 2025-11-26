/**
 * Font Repository System
 *
 * Extensible architecture for managing font sources.
 * Users can add custom repositories, and AI can interact via commands.
 */

export interface FontVariant {
  weight: string | number;
  style: "normal" | "italic";
  url?: string;
}

export interface Font {
  id: string;
  family: string;
  category: "sans-serif" | "serif" | "display" | "handwriting" | "monospace";
  variants: FontVariant[];
  subsets: string[];

  // Source information
  source: string; // Repository ID
  sourceUrl?: string;

  // Metadata
  designer?: string;
  year?: number;
  license?: string;
  popularity?: number;
  tags?: string[];

  // Preview
  previewText?: string;
  thumbnail?: string;
}

/**
 * Font Repository Interface
 * Implement this to create a custom font source
 */
export interface FontRepository {
  id: string;
  name: string;
  description: string;
  type: "api" | "database" | "cdn" | "custom";

  // Configuration
  enabled: boolean;
  config?: Record<string, any>;
  apiKey?: string;
  apiUrl?: string;

  // Capabilities
  capabilities: {
    search: boolean;
    categories: boolean;
    variants: boolean;
    preview: boolean;
    download: boolean;
  };

  // Methods (implemented by repository plugin)
  fetchFonts: (options?: FetchOptions) => Promise<Font[]>;
  searchFonts: (query: string) => Promise<Font[]>;
  loadFont: (font: Font, variants?: string[]) => Promise<void>;
  getFontUrl: (font: Font, variant?: FontVariant) => string;
}

export interface FetchOptions {
  limit?: number;
  offset?: number;
  category?: string;
  sort?: "popularity" | "alphabetical" | "recent";
  cached?: boolean;
}

/**
 * Built-in Repository Types
 */

// Google Fonts Repository
export interface GoogleFontsRepository extends FontRepository {
  type: "api";
  apiUrl: "https://www.googleapis.com/webfonts/v1/webfonts";
  config: {
    apiKey?: string; // Optional - works without key
    sort: "popularity" | "alphabetical" | "trending";
  };
}

// Adobe Fonts Repository
export interface AdobeFontsRepository extends FontRepository {
  type: "api";
  apiUrl: "https://typekit.com/api/v1/json/kits";
  config: {
    apiKey: string; // Required
    kitId?: string;
  };
}

// Font Squirrel Repository
export interface FontSquirrelRepository extends FontRepository {
  type: "cdn";
  apiUrl: "https://www.fontsquirrel.com/api";
  config: {
    licenseFilter: "commercial" | "all";
  };
}

// Custom Database Repository
export interface CustomDatabaseRepository extends FontRepository {
  type: "database";
  config: {
    databaseUrl: string;
    authToken?: string;
  };
}

// User Upload Repository
export interface UserUploadRepository extends FontRepository {
  type: "custom";
  config: {
    uploadUrl: string;
    storageProvider: "local" | "s3" | "cloudinary";
  };
}

/**
 * Repository Manager
 * Manages all font repositories
 */
export interface RepositoryManager {
  repositories: FontRepository[];
  activeRepositoryIds: string[];

  // Repository management
  addRepository: (repository: FontRepository) => void;
  removeRepository: (id: string) => void;
  enableRepository: (id: string) => void;
  disableRepository: (id: string) => void;

  // Font operations across all repositories
  getAllFonts: (options?: FetchOptions) => Promise<Font[]>;
  searchAllFonts: (query: string) => Promise<Font[]>;
  getFontsByRepository: (repositoryId: string) => Promise<Font[]>;

  // Sync & cache
  syncRepository: (id: string) => Promise<void>;
  clearCache: () => void;
}

/**
 * Font Effects & Animations
 */

export interface TextEffect {
  id: string;
  name: string;
  type: "shadow" | "outline" | "gradient" | "glow" | "3d" | "pattern";

  // Effect properties
  properties: Record<string, any>;
  css?: string;

  // Preview
  preview?: string;
}

export interface TextAnimation {
  id: string;
  name: string;
  type: "entrance" | "exit" | "hover" | "typing" | "capsule" | "wave" | "bounce" | "fade";

  // Animation properties
  duration: number; // ms
  delay: number; // ms
  easing: string;
  iterations: number | "infinite";

  // Keyframes
  keyframes?: Record<string, any>;
  css?: string;

  // Preview
  preview?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };

  // Metadata
  tags?: string[];
  designer?: string;
}

/**
 * Command System for AI Integration
 */

export interface TypographyCommand {
  action:
    | "create_style"
    | "update_style"
    | "delete_style"
    | "search_fonts"
    | "add_effect"
    | "add_animation"
    | "apply_palette"
    | "export_css"
    | "import_style";

  parameters: Record<string, any>;
  metadata?: {
    source: "ai" | "user" | "api";
    timestamp: number;
  };
}

export interface TypographyCommandResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Advanced Typography Style
 */
export interface AdvancedTypographyStyle {
  id: string;
  name: string;

  // Basic typography
  fontFamily: string;
  fontSize: string;
  fontWeight: number | string;
  lineHeight: string;
  letterSpacing: string;
  color: string;

  // Advanced properties
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: string;
  fontStyle?: "normal" | "italic";

  // Effects
  effects: TextEffect[];

  // Animations
  animations: TextAnimation[];

  // Color palette
  palette?: ColorPalette;

  // Responsive
  responsive?: {
    mobile?: Partial<AdvancedTypographyStyle>;
    tablet?: Partial<AdvancedTypographyStyle>;
    desktop?: Partial<AdvancedTypographyStyle>;
  };

  // Metadata
  category?: "heading" | "body" | "display" | "code" | "custom";
  tags?: string[];
  source?: string; // Repository ID

  // Export
  css?: string;
  customCSS?: string;
}
