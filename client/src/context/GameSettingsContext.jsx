import { createContext, useContext, useState, useEffect } from "react";

const GameSettingsContext = createContext();

const STORAGE_KEY = "lrrpg-settings";

export function GameSettingsProvider({ children }) {
  const [quickMode, setQuickMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "quick";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, quickMode ? "quick" : "full");
    } catch {}
  }, [quickMode]);

  return (
    <GameSettingsContext.Provider value={{ quickMode, setQuickMode }}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings() {
  return useContext(GameSettingsContext);
}
