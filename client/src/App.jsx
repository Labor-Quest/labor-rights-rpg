import { useState } from "react";
import { FontSizeProvider, useFontSize } from "./context/FontSizeContext.jsx";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import { GameSettingsProvider, useGameSettings } from "./context/GameSettingsContext.jsx";
import TitleScreen from "./screens/TitleScreen.jsx";
import CharacterSelect from "./screens/CharacterSelect.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import EndScreen from "./screens/EndScreen.jsx";
import AboutScreen from "./screens/AboutScreen.jsx";

const SCREENS = {
  TITLE: "title",
  CHARACTER_SELECT: "character_select",
  GAME: "game",
  END: "end",
  ABOUT: "about",
};

function FontSizeToggle() {
  const { fontSize, setFontSize } = useFontSize();
  const sizes = ["small", "medium", "large"];
  const labels = { small: "A-", medium: "A", large: "A+" };

  return (
    <div className="font-size-toggle">
      {sizes.map((size) => (
        <button
          key={size}
          className={`font-size-btn ${fontSize === size ? "font-size-btn-active" : ""}`}
          onClick={() => setFontSize(size)}
          aria-label={`Font size ${size}`}
        >
          {labels[size]}
        </button>
      ))}
    </div>
  );
}

function QuickModeToggle() {
  const { quickMode, setQuickMode } = useGameSettings();
  const { t } = useLanguage();

  return (
    <div className="font-size-toggle">
      <button
        className={`font-size-btn ${quickMode ? "font-size-btn-active" : ""}`}
        onClick={() => setQuickMode(!quickMode)}
        aria-label="Quick mode"
        title={quickMode ? t("settings.full") : t("settings.quick")}
      >
        {quickMode ? "\u26A1" : "\uD83D\uDCD6"}
      </button>
    </div>
  );
}

function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="font-size-toggle">
      <button
        className={`font-size-btn ${locale === "en" ? "font-size-btn-active" : ""}`}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        className={`font-size-btn ${locale === "tl" ? "font-size-btn-active" : ""}`}
        onClick={() => setLocale("tl")}
      >
        TL
      </button>
    </div>
  );
}

function AppContent() {
  const [screen, setScreen] = useState(SCREENS.TITLE);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [finalGameState, setFinalGameState] = useState(null);
  const { t } = useLanguage();

  function handleStart() {
    setScreen(SCREENS.CHARACTER_SELECT);
  }

  function handleCharacterSelect(character) {
    setSelectedCharacter(character);
    setScreen(SCREENS.GAME);
  }

  function handleGameEnd(gameState) {
    setFinalGameState(gameState);
    setScreen(SCREENS.END);
  }

  function handleRestart() {
    setSelectedCharacter(null);
    setFinalGameState(null);
    setScreen(SCREENS.CHARACTER_SELECT);
  }

  function handleHome() {
    setSelectedCharacter(null);
    setFinalGameState(null);
    setScreen(SCREENS.TITLE);
  }

  function handleAbout() {
    setScreen(SCREENS.ABOUT);
  }

  return (
    <>
      {screen !== SCREENS.TITLE && (
        <div className="header">
          <span className="header-title">{t("app.title")}</span>
          <div className="header-controls">
            <QuickModeToggle />
            <LanguageToggle />
            <FontSizeToggle />
            <button className="btn" onClick={handleHome} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
              {t("nav.home")}
            </button>
          </div>
        </div>
      )}
      <div className="container fade-in" key={screen + (selectedCharacter?.id || "")}>
        {screen === SCREENS.TITLE && <TitleScreen onStart={handleStart} onAbout={handleAbout} />}
        {screen === SCREENS.ABOUT && <AboutScreen />}
        {screen === SCREENS.CHARACTER_SELECT && <CharacterSelect onSelect={handleCharacterSelect} />}
        {screen === SCREENS.GAME && (
          <GameScreen character={selectedCharacter} onGameEnd={handleGameEnd} />
        )}
        {screen === SCREENS.END && (
          <EndScreen
            gameState={finalGameState}
            character={selectedCharacter}
            onRestart={handleRestart}
          />
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <FontSizeProvider>
        <GameSettingsProvider>
          <AppContent />
        </GameSettingsProvider>
      </FontSizeProvider>
    </LanguageProvider>
  );
}
