import { createContext, useContext, useState, useEffect } from "react";

const FontSizeContext = createContext();

const SIZES = {
  small: 16,
  medium: 19,
  large: 22,
};

const STORAGE_KEY = "lrrpg-font-size";

export function FontSizeProvider({ children }) {
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "medium";
    } catch {
      return "medium";
    }
  });

  useEffect(() => {
    const basePx = SIZES[fontSize] || SIZES.medium;
    // Add +1px bump on mobile for better readability
    const isMobile = window.innerWidth < 768;
    const finalPx = isMobile ? basePx + 1 : basePx;
    document.documentElement.style.fontSize = `${finalPx}px`;

    try {
      localStorage.setItem(STORAGE_KEY, fontSize);
    } catch {
      // localStorage unavailable
    }
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
