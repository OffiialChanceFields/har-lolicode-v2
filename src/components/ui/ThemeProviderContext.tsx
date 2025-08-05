import { createContext } from "react";

interface ThemeProviderState {
  theme: string;
  setTheme: (theme: string) => void;
}

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);
