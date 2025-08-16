// side-effect initializer — no imports
const _Views = { Board: "Board", Language: "Language", Driver: "Driver" } as const;
const _SubView = { canvas: "canvas", design: "design" } as const;

(globalThis as any).ACER ||= { Views: _Views, SubView: _SubView };

// make this file a module so TS is happy importing it
export {};
