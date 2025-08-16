// state/navbar.ts
import { create } from "zustand";

// These come from your global.d.ts unions
type V = Views;        // "Board" | "Language" | "Driver"
type SV = SubView;     // "canvas" | "design"

interface NavbarState {
  currentView: V;
  subView: SV | null;
  setView: (v: V) => void;
  toggleSubView: () => void;
  setSubView: (sv: SV) => void;
}

const useNavbar = create<NavbarState>((set) => ({
  currentView: ACER.Views.Board,           // runtime value
  subView: "canvas",                        // default only valid for Board
  setView: (v) => set({
    currentView: v,
    subView: v === "Board" ? "canvas" : null,
  }),
  toggleSubView: () =>
    set((state) =>
      state.currentView !== "Board"
        ? state
        : {
            ...state,
            subView: state.subView === "canvas" ? "design" : "canvas",
          }
    ),
  setSubView: (sv) =>
    set((state) => (state.currentView === "Board" ? { ...state, subView: sv } : state)),
}));

export default useNavbar;
