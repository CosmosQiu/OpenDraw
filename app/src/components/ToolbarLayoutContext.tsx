import { createContext, useContext } from "react";

export interface ToolbarLayoutContextValue {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export const ToolbarLayoutContext = createContext<ToolbarLayoutContextValue | null>(null);

export function useToolbarLayout() {
  const value = useContext(ToolbarLayoutContext);
  if (!value) {
    throw new Error("useToolbarLayout must be used within ToolbarLayoutContext");
  }
  return value;
}
