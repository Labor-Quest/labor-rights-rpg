import { useState, useEffect } from "react";
import { fetchScenarios } from "../engine/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  createGameState,
  getCurrentNode,
  makeChoice,
  getScoreGrade,
} from "../engine/GameEngine.js";

// Split long paragraphs at sentence boundaries for elderly readability
function splitLongParagraphs(text, maxWords = 120) {
  return text.split("\n").filter(Boolean).flatMap((para) => {
    const words = para.split(/\s+/);
    if (words.length <= maxWords) return [para];
    const mid = Math.floor(para.length / 2);
    const sentenceEnd = para.indexOf(". ", mid - 40);
    if (sentenceEnd !== -1 && sentenceEnd < mid + 60) {
      return [para.slice(0, sentenceEnd + 1), para.slice(sentenceEnd + 2)];
    }
    return [para];
  });
}

export default function GameScreen({ character, onGameEnd }) {
  const [scenarioData, setScenarioData] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [lastConsequence, setLastConsequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, locale } = useLanguage();

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

    setLastConsequence({
      text: choice.consequence,
      score: choice.scoreChange || 0,
      knowledge: choice.knowledgeGained,
    });

    const newState = makeChoice(scenarioData, gameState, choiceIndex);
    setGameState(newState);

    if (newState.isComplete) {
      setTimeout(() => onGameEnd(newState), 100);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <div className="loading">{t("game.loading")}</div>;
  if (error) return <div className="loading">{t("game.error")}: {error}</div>;
  if (!gameState || !scenarioData) return null;

  const currentNode = getCurrentNode(scenarioData, gameState);
  if (!currentNode) {
    return <div className="loading">{t("game.brokenLink")}</div>;
  }

  const grade = getScoreGrade(gameState);

  return (
    <div>
      {/* Scene header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span className="badge">{currentNode.theme?.replace(/_/g, " ") || "scenario"}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
          {t("game.step")} {gameState.history.length + 1}
        </span>
      </div>

      <h2 style={{ fontSize: "1.4rem", marginBottom: "1.25rem" }}>{currentNode.title}</h2>

      {/* Show consequence from last choice */}
      {lastConsequence && (
        <div className={`consequence ${
          lastConsequence.score > 0 ? "consequence-positive" :
          lastConsequence.score < 0 ? "consequence-negative" : "consequence-neutral"
        }`}>
          <div style={{ marginBottom: lastConsequence.knowledge ? "0.5rem" : 0 }}>
            {lastConsequence.text}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              ({lastConsequence.score > 0 ? "+" : ""}{lastConsequence.score} pts)
            </span>
          </div>
          {lastConsequence.knowledge && (
            <div className="knowledge-item" style={{ marginBottom: 0 }}>
              {lastConsequence.knowledge}
            </div>
          )}
        </div>
      )}

      {/* Narrative */}
      <div className="narrative">
        {splitLongParagraphs(currentNode.narrative).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Choices */}
      {currentNode.choices && !currentNode.isEnding && (
        <div>
          <h3>{t("game.whatDoYouDo")}</h3>
          {currentNode.choices.map((choice, i) => (
            <button
              key={i}
              className="choice-btn"
              onClick={() => handleChoice(i)}
            >
              <span className="choice-number">[{String.fromCharCode(65 + i)}]</span>
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {/* Score bar */}
      <div className="score-bar">
        <span>{t("score.score")}</span>
        <span className="score-value">{gameState.score}</span>
        <span>|</span>
        <span>{t("score.grade")}</span>
        <span className="score-value">{grade.grade}</span>
        <span>|</span>
        <span>{t("score.knowledge")}</span>
        <span className="score-value">{gameState.knowledgeGained.length}</span>
      </div>
    </div>
  );
}
