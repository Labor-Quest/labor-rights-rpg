import { useState, useEffect } from "react";
import { fetchScenarios } from "../engine/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useGameSettings } from "../context/GameSettingsContext.jsx";
import NarrativeRevealer from "../components/NarrativeRevealer.jsx";
import StatDelta from "../components/StatDelta.jsx";
import {
  createGameState,
  getCurrentNode,
  makeChoice,
  applyEvent,
} from "../engine/GameEngine.js";
import { evaluateAllChoices } from "../engine/GatingRules.js";

const THEME_ICONS = {
  wage_theft: "\uD83D\uDCB0", recruitment_scams: "\uD83D\uDEA8", no_contract: "\uD83D\uDCCB",
  unsafe_conditions: "\u26A0\uFE0F", abuse: "\uD83D\uDEE1\uFE0F", overtime: "\u23F0",
  no_benefits: "\uD83C\uDFE5", misclassification: "\uD83C\uDFF7\uFE0F",
  forced_overtime: "\uD83D\uDE24", health_hazards: "\u2623\uFE0F",
  contractualization: "\uD83D\uDCCE", union_busting: "\uD83D\uDD07",
  kasambahay_law: "\uD83C\uDFE0", algorithmic_management: "\uD83E\uDD16",
  document_confiscation: "\uD83D\uDD12", contract_substitution: "\uD83D\uDCDD",
  employer_employee_test: "\u2696\uFE0F", accident_liability: "\uD83D\uDE91",
  unfair_deductions: "\u2702\uFE0F", illegal_deductions: "\uD83D\uDCB8",
};

export default function GameScreen({ character, onGameEnd }) {
  const [scenarioData, setScenarioData] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [lastConsequence, setLastConsequence] = useState(null);
  const [narrativeComplete, setNarrativeComplete] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showKnowledgeUnlock, setShowKnowledgeUnlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, locale } = useLanguage();
  const { quickMode } = useGameSettings();

  useEffect(() => {
    setLoading(true);
    fetchScenarios(character.id, locale)
      .then((data) => {
        setScenarioData(data);
        setGameState(createGameState(character.id, data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [character.id, locale]);

  function handleChoice(choiceIndex) {
    const currentNode = getCurrentNode(scenarioData, gameState);
    const choice = currentNode.choices[choiceIndex];

    // Visual feedback: highlight selected, dim others
    setSelectedChoice(choiceIndex);

    setTimeout(() => {
      // Show knowledge unlock celebration
      if (choice.knowledgeGained) {
        setShowKnowledgeUnlock(choice.knowledgeGained);
        try { navigator.vibrate?.(100); } catch {}
      }

      setLastConsequence({
        text: choice.consequence,
        score: choice.scoreChange || 0,
        knowledge: choice.knowledgeGained,
      });

      // Transition
      setTransitioning(true);
      setTimeout(() => {
        const newState = makeChoice(scenarioData, gameState, choiceIndex);
        setGameState(newState);
        setNarrativeComplete(false);
        setSelectedChoice(null);
        setTransitioning(false);

        if (newState.isComplete) {
          setTimeout(() => onGameEnd(newState), 100);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }, 400);
  }

  function handleDismissEvent() {
    const event = gameState.pendingExpense || gameState.pendingCrisis || gameState.pendingBoost;
    if (event) {
      setGameState(applyEvent(gameState, event));
    }
  }

  function handleDismissKnowledge() {
    setShowKnowledgeUnlock(null);
  }

  if (loading) return <div className="loading">{t("game.loading")}</div>;
  if (error) return <div className="loading">{t("game.error")}: {error}</div>;
  if (!gameState || !scenarioData) return null;

  // Show event interstitials (expense, crisis, or boost)
  const pendingEvent = gameState.pendingExpense || gameState.pendingCrisis || gameState.pendingBoost;
  if (pendingEvent) {
    const eventText = locale === "tl" ? pendingEvent.tl : pendingEvent.en;
    const isExpense = !!gameState.pendingExpense;
    const isBoost = !!gameState.pendingBoost;
    const eventType = isBoost ? "event-boost" : (isExpense ? "event-expense" : "event-crisis");
    const eventLabel = isBoost ? t("event.boost") : (isExpense ? t("event.expense") : t("event.crisis"));

    // Build stat change summary for boosts
    const boostChanges = isBoost ? [
      pendingEvent.peraGain && `+₱${pendingEvent.peraGain.toLocaleString()}`,
      pendingEvent.confidenceGain && `+${pendingEvent.confidenceGain} ${t("stat.confidence")}`,
      pendingEvent.wellbeingGain && `+${pendingEvent.wellbeingGain} ${t("stat.wellbeing")}`,
    ].filter(Boolean).join("  ") : null;

    return (
      <div className="fade-in">
        <div className={`event-interstitial ${eventType}`}>
          <h3>{eventLabel}</h3>
          <p style={{ color: "var(--text-primary)", fontSize: "1.05rem", lineHeight: 1.8 }}>
            {eventText}
          </p>
          {isBoost ? (
            <div className="event-gain">{boostChanges}</div>
          ) : (
            <div className="event-cost">
              -₱{pendingEvent.cost?.toLocaleString()}
            </div>
          )}
          <button className="btn btn-primary" onClick={handleDismissEvent} style={{ marginTop: "1rem", width: "100%" }}>
            {t("event.continue")}
          </button>
        </div>
        {/* Show current stats below */}
        <StatsHUD stats={gameState.stats} t={t} />
      </div>
    );
  }

  const currentNode = getCurrentNode(scenarioData, gameState);
  if (!currentNode) {
    return <div className="loading">{t("game.brokenLink")}</div>;
  }

  // Detect theme change for chapter markers
  const prevTheme = gameState.history.length > 0 ? gameState.history[gameState.history.length - 1].theme : null;
  const currentTheme = currentNode.theme;
  const isNewChapter = currentTheme && prevTheme && currentTheme !== prevTheme;
  // Count distinct themes seen so far for chapter numbering
  const seenThemes = [];
  for (const h of gameState.history) {
    if (h.theme && (seenThemes.length === 0 || seenThemes[seenThemes.length - 1] !== h.theme)) {
      seenThemes.push(h.theme);
    }
  }
  const chapterNumber = seenThemes.length + 1;

  // Evaluate choice availability
  const choiceResults = currentNode.choices && !currentNode.isEnding
    ? evaluateAllChoices(currentNode.choices, currentNode.theme, gameState.stats)
    : [];

  // Determine if choices should show
  const showChoices = (narrativeComplete || quickMode) && !currentNode.isEnding && choiceResults.length > 0;

  // Progress
  const totalNodes = Object.keys(scenarioData.nodes).length;
  const progressPct = Math.min(95, Math.round((gameState.history.length / totalNodes) * 100));

  return (
    <div>
      {/* Progress bar */}
      <div className="progress-bar" style={{ marginBottom: "1rem" }}>
        <div className="progress-fill" style={{ width: `${currentNode.isEnding ? 100 : progressPct}%` }} />
      </div>

      {/* Chapter transition marker */}
      {isNewChapter && (
        <div className="chapter-marker">
          <div className="chapter-marker-label">{t("chapter.label")} {chapterNumber}</div>
          <div className="chapter-marker-theme">
            {THEME_ICONS[currentTheme] || "\uD83D\uDCCC"} {t(`chapter.theme.${currentTheme}`) || currentTheme?.replace(/_/g, " ")}
          </div>
        </div>
      )}

      {/* Knowledge unlock celebration */}
      {showKnowledgeUnlock && (
        <div className="knowledge-unlock" onClick={handleDismissKnowledge}>
          <h3 className="knowledge-unlock-title">{t("game.knowledgeUnlocked")}</h3>
          <div className="knowledge-item" style={{ marginBottom: 0 }}>{showKnowledgeUnlock}</div>
          <button className="btn" onClick={handleDismissKnowledge} style={{ marginTop: "0.75rem", width: "100%", fontSize: "0.85rem" }}>
            {t("event.continue")}
          </button>
        </div>
      )}

      {/* Scene header with theme icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{THEME_ICONS[currentNode.theme] || "\uD83D\uDCCC"}</span>
          <span className="badge">{currentNode.theme?.replace(/_/g, " ") || "scenario"}</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
          {t("game.step")} {gameState.history.length + 1}
        </span>
      </div>

      <h2 style={{ fontSize: "1.4rem", marginBottom: "1.25rem" }}>{currentNode.title}</h2>

      {/* Consequence from last choice */}
      {lastConsequence && (
        <div className={`consequence consequence-slide ${
          lastConsequence.score > 0 ? "consequence-positive" :
          lastConsequence.score < 0 ? "consequence-negative" : "consequence-neutral"
        }`}>
          <div>
            {lastConsequence.text}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              ({lastConsequence.score > 0 ? "+" : ""}{lastConsequence.score} pts)
            </span>
          </div>
        </div>
      )}

      {/* Narrative with progressive reveal */}
      <div className={transitioning ? "fade-out" : "fade-in"}>
        <NarrativeRevealer
          text={currentNode.narrative}
          nodeId={gameState.currentNodeId}
          quickMode={quickMode}
          onFullyRevealed={() => setNarrativeComplete(true)}
        />
      </div>

      {/* Choices with gating */}
      {showChoices && (
        <div className={transitioning ? "fade-out" : "fade-in"}>
          <h3>{t("game.whatDoYouDo")}</h3>
          {choiceResults.map((result, i) => {
            const { choice, available, lockedKey, requirements } = result;
            const isSelected = selectedChoice === i;
            const isDimmed = selectedChoice !== null && selectedChoice !== i;

            if (!available) {
              // Gated choice — visible but disabled
              return (
                <div key={i} className="choice-btn choice-locked">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span className="choice-number">\uD83D\uDD12</span>
                    <div>
                      <div style={{ marginBottom: "0.3rem" }}>{choice.text}</div>
                      <div className="choice-locked-reason">
                        {t(lockedKey)}
                        {requirements && (
                          <span className="choice-locked-req">
                            {Object.entries(requirements).map(([stat, { required }]) => (
                              <span key={stat}> {t(`stat.${stat}`)} {stat === "pera" ? `₱${required.toLocaleString()}` : required}+</span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Available choice
            const confidenceDoubt = gameState.stats.confidence < 25 && (choice.scoreChange || 0) >= 10;
            return (
              <button
                key={i}
                className={`choice-btn ${isSelected ? "choice-selected" : ""} ${isDimmed ? "choice-dimmed" : ""}`}
                onClick={() => selectedChoice === null && handleChoice(i)}
                disabled={selectedChoice !== null}
              >
                <span className="choice-number">[{String.fromCharCode(65 + i)}]</span>
                {choice.text}
                {confidenceDoubt && (
                  <span className="choice-doubt"> {t("game.doubt")}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* RPG Stats HUD */}
      <StatsHUD stats={{ ...gameState.stats, knowledgeCount: gameState.knowledgeGained.length }} lastChanges={gameState.lastStatChanges} t={t} />
    </div>
  );
}

function StatsHUD({ stats, lastChanges, t }) {
  const inDebt = stats.pera < 0;

  return (
    <div className="stats-hud">
      <div className="stat-item">
        <div className="stat-value-row">
          <span className={`stat-value ${inDebt ? "stat-debt" : ""}`}>
            {inDebt ? "-" : ""}₱{Math.abs(stats.pera).toLocaleString()}
          </span>
          {lastChanges?.pera ? <StatDelta value={lastChanges.pera} prefix="₱" /> : null}
        </div>
        <div className="stat-label">{inDebt ? t("stat.debt") : t("stat.money")}</div>
      </div>
      <div className="stat-item">
        <div className="stat-value-row">
          <span className="stat-value">{stats.wellbeing}</span>
          {lastChanges?.wellbeing ? <StatDelta value={lastChanges.wellbeing} /> : null}
        </div>
        <div className="stat-bar-mini">
          <div className="stat-bar-fill" style={{
            width: `${stats.wellbeing}%`,
            background: stats.wellbeing > 40 ? "var(--positive)" : stats.wellbeing > 20 ? "var(--accent)" : "var(--negative)"
          }} />
        </div>
        <div className="stat-label">{t("stat.wellbeing")}</div>
      </div>
      <div className="stat-item">
        <div className="stat-value-row">
          <span className="stat-value">{stats.confidence}</span>
          {lastChanges?.confidence ? <StatDelta value={lastChanges.confidence} /> : null}
        </div>
        <div className="stat-bar-mini">
          <div className="stat-bar-fill" style={{
            width: `${stats.confidence}%`,
            background: stats.confidence > 50 ? "var(--info)" : stats.confidence > 25 ? "var(--accent)" : "var(--negative)"
          }} />
        </div>
        <div className="stat-label">{t("stat.confidence")}</div>
      </div>
      <div className="stat-item">
        <div className="stat-value-row">
          <span className="stat-value">{stats.knowledgeCount ?? 0}</span>
        </div>
        <div className="stat-label">{t("stat.knowledge")}</div>
      </div>
    </div>
  );
}
