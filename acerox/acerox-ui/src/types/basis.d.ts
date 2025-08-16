export {};

declare global {
  type Views = "Board" | "Language" | "Driver";
  type SubView = "canvas" | "design";
  type BoardView<T extends Views> = T extends "Board" ? SubView : null;

  // IntelliSense shape for the runtime global
  var ACER: {
    Views: Record<Views, Views>;
    SubView: Record<SubView, SubView>;
  };
}
