"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    const applyTheme = () => {
      const storedTheme = localStorage.getItem("panelva_theme") || "dark";
      const root = document.documentElement;
      
      if (storedTheme === "light") {
        root.classList.add("light-theme");
        root.classList.remove("dark-theme");
      } else {
        root.classList.add("dark-theme");
        root.classList.remove("light-theme");
      }
    };

    // Apply immediately on mount
    applyTheme();

    // Listen for custom theme updates within the same tab
    window.addEventListener("panelva_theme_update", applyTheme);
    
    // Listen for storage events (updates across different tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "panelva_theme") {
        applyTheme();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("panelva_theme_update", applyTheme);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return null;
}
