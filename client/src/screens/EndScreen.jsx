import { useState, useEffect } from "react";
import { fetchResources } from "../engine/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getScoreGrade, getPlayTime } from "../engine/GameEngine.js";

export default function EndScreen({ gameState, character, onRestart }) {
  const [resources, setResources] = useState(null);
  const [shareMsg, setShareMsg] = useState(null);
  const { t } = useLanguage();
  const grade = getScoreGrade(gameState);
  const gradeLabel = t(`grade.${grade.grade}`);

  useEffect(() => {
    fetchResources().then(setResources).catch(() => {});
  }, []);

  function handleShare() {
    const text = `${gradeLabel} (${grade.grade}) — ${character.name} | Labor Rights RPG ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({ title: "Labor Rights RPG", text, url: window.location.origin }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareMsg(t("end.shareCopied"));
        setTimeout(() => setShareMsg(null), 2000);
      }).catch(() => {});
    }
  }

  return (
    <div>
      {/* Final score */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h3>{t("end.complete")}</h3>
        <h1 style={{ fontSize: "3rem", color: "var(--accent)", marginBottom: "0.25rem" }}>
          {grade.grade}
        </h1>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          {gradeLabel}
        </h2>
        <p>
          {t("end.playingAs")} {character.name} ({character.role})
        </p>

        <div className="stats-grid">
          <div>
            <div style={{ color: "var(--text-dim)" }}>{t("end.score")}</div>
            <div className="score-value" style={{ fontSize: "1.2rem" }}>{gameState.score}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-dim)" }}>{t("end.decisions")}</div>
            <div className="score-value" style={{ fontSize: "1.2rem" }}>{gameState.history.length}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-dim)" }}>{t("end.knowledge")}</div>
            <div className="score-value" style={{ fontSize: "1.2rem" }}>{gameState.knowledgeGained.length}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-dim)" }}>{t("end.time")}</div>
            <div className="score-value" style={{ fontSize: "1.2rem" }}>{getPlayTime(gameState)}</div>
          </div>
        </div>

        {/* Share button */}
        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn" onClick={handleShare} style={{ fontSize: "0.9rem" }}>
            {t("end.share")}
          </button>
          {shareMsg && (
            <div style={{ color: "var(--positive)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              {shareMsg}
            </div>
          )}
        </div>
      </div>

      {/* Knowledge gained */}
      {gameState.knowledgeGained.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>{t("end.knowledgeGained")}</h3>
          {gameState.knowledgeGained.map((k, i) => (
            <div key={i} className="knowledge-item">{k}</div>
          ))}
        </div>
      )}

      {/* Decision history */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>{t("end.journey")}</h3>
        {gameState.history.map((h, i) => (
          <div key={i} style={{
            padding: "0.75rem 0",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.9rem"
          }}>
            <div style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: "0.2rem" }}>
              {h.nodeTitle}
            </div>
            <div style={{ color: "var(--text-dim)" }}>
              {t("end.youChose")} {h.choiceText}
              <span className={h.scoreChange > 0 ? "score-positive" : h.scoreChange < 0 ? "score-negative" : ""}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                {h.scoreChange > 0 ? "+" : ""}{h.scoreChange}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legal resources */}
      {resources && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>{t("end.resources")}</h3>
          <p>{t("end.resourcesDesc")}</p>

          {resources.legal_resources.map((r, i) => (
            <div key={i} className="resource-card">
              <h4>{r.name}</h4>
              <p style={{ marginBottom: "0.3rem", fontSize: "0.85rem" }}>{r.description}</p>
              {r.hotline && <div className="hotline">{t("end.hotline")} {r.hotline}</div>}
              {r.website && (
                <div style={{ fontSize: "0.85rem" }}>
                  <a href={r.website} target="_blank" rel="noopener noreferrer">{r.website}</a>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: "1.5rem" }}>
            <h3>{t("end.emergency")}</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {resources.emergency_contacts.map((c, i) => (
                <div key={i} style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  flex: "1 1 200px"
                }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{c.name}</div>
                  <div className="hotline">{c.number}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Play again */}
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <button className="btn btn-primary" onClick={onRestart} style={{ fontSize: "1rem", padding: "0.8rem 2rem" }}>
          {t("end.playAgain")}
        </button>
      </div>
    </div>
  );
}
