// src/types/nodes.ts
export type ID = string;

export type NodeEventMap = {
  onClick?: (nodeId: ID) => void;
  onDoubleClick?: (nodeId: ID) => void;
  onHover?: (nodeId: ID) => void;
};

export type NodeAction = {
  id: string;                       // e.g. "duplicate"
  label: string;                    // e.g. "Duplicate"
  icon?: React.ComponentType<{ className?: string }>;
  run: (nodeId: ID) => void;        // imperative action
  show?: (node: TreeNode) => boolean; // optional visibility guard
};

export type NodeTypeDef<TProps = Record<string, unknown>> = {
  type: string;                     // "layer" | "container" | "text" | "3d" | ...
  displayName: string;              // UI name
  icon?: React.ComponentType<{ className?: string }>;
  defaults: {
    props?: TProps;
    name?: string;
    expanded?: boolean;
  };
  allowedChildren?: string[];       // which child types are valid
  actions?: NodeAction[];
  events?: NodeEventMap;
};

export type TreeNode = {
  id: ID;
  type: string;                     // matches NodeTypeDef.type
  name: string;
  expanded?: boolean;
  props?: Record<string, unknown>;
  children?: TreeNode[];
};
