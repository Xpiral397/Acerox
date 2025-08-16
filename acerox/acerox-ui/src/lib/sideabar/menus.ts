// src/libs/menus.ts
export type MenuValue = string | MenuJSON | Array<string | MenuJSON>;
export type MenuJSON = { [label: string]: MenuValue };

// Canvas menu (what to show)
export const MENU_CANVAS: MenuJSON = {
  Insert: ["Layer", "Container", "Text", "Image"],
  Arrange: {
    Align: ["Left", "Center", "Right", "Top", "Middle", "Bottom"],
    Order: ["Bring To Front", "Send To Back"],
  },
  CloneObject: { Left: [] }, // demo
};

// Design menu
export const MENU_DESIGN: MenuJSON = {
  Insert: ["Layer", "Container"],
  Styling: {
    Tokens: ["Primary", "Surface", "Text", "Accent"],
    Effects: ["Shadow", "Blur", "Radius", "Stroke"],
  },
};
