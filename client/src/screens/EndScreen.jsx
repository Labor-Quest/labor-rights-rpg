import { useState, useEffect } from "react";
import { fetchResources } from "../engine/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getScoreGrade, getPlayTime } from "../engine/GameEngine.js";
import { getEpilogue, classifyEnding } from "../engine/EndingModifiers.js";

export default function EndScreen({ gameState, character, onRestart }) {
  const [resources, setResources] = useState(null);
  const [shareMsg, setShareMsg] = useState(null);
  const { t, locale } = useLanguage();
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

      {/* RPG Stats summary */}
      {gameState.stats && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>{t("end.epilogue")}</h3>
          <div className="stats-hud" style={{ borderTop: "none", marginTop: 0, marginBottom: "1rem" }}>
            <div className="stat-item">
              <div className="stat-value-row">
                <span className={`stat-value ${gameState.stats.pera < 0 ? "stat-debt" : ""}`}>
                  {gameState.stats.pera < 0 ? "-" : ""}₱{Math.abs(gameState.stats.pera).toLocaleString()}
                </span>
              </div>
              <div className="stat-bar-mini">
                <div className="stat-bar-fill" style={{
                  width: `${Math.max(0, Math.min(100, (gameState.stats.pera / (gameState.startingStats?.pera || 10000)) * 50 + 50))}%`,
                  background: gameState.stats.pera >= 0 ? "var(--accent)" : "var(--negative)"
                }} />
              </div>
              <div className="stat-label">{gameState.stats.pera < 0 ? t("stat.debt") : t("stat.money")}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value-row"><span className="stat-value">{gameState.stats.wellbeing}</span></div>
              <div className="stat-bar-mini">
                <div className="stat-bar-fill" style={{
                  width: `${gameState.stats.wellbeing}%`,
                  background: gameState.stats.wellbeing > 40 ? "var(--positive)" : "var(--negative)"
                }} />
              </div>
              <div className="stat-label">{t("stat.wellbeing")}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value-row"><span className="stat-value">{gameState.stats.confidence}</span></div>
              <div className="stat-bar-mini">
                <div className="stat-bar-fill" style={{
                  width: `${gameState.stats.confidence}%`,
                  background: gameState.stats.confidence > 50 ? "var(--info)" : "var(--negative)"
                }} />
              </div>
              <div className="stat-label">{t("stat.confidence")}</div>
            </div>
          </div>
          <div className="consequence consequence-neutral" style={{ animation: "none" }}>
            {getEpilogue(gameState.stats, locale)}
          </div>
        </div>
      )}

      {/* Knowledge gained */}
      {gameState.knowledgeGained.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>{t("end.knowledgeGained")}</h3>
          {gameState.knowledgeGained.map((k, i) => (
            <div key={i} className="knowledge-item">{k}</div>
          ))}
        </div>
      )}

      {/* Story summary — grouped by theme chapters */}
      {gameState.history.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3>{t("end.storySummary")}</h3>
          {(() => {
            // Group decisions into chapters by consecutive theme
            const chapters = [];
            let current = null;
            for (const h of gameState.history) {
              const theme = h.theme || "scenario";
              if (!current || current.theme !== theme) {
                current = { theme, decisions: [] };
                chapters.push(current);
              }
              current.decisions.push(h);
            }
            return chapters.map((ch, i) => {
              const chapterScore = ch.decisions.reduce((sum, d) => sum + (d.scoreChange || 0), 0);
              return (
                <div key={i} style={{
                  padding: "0.75rem 1rem",
                  borderLeft: `3px solid ${chapterScore >= 0 ? "var(--positive)" : "var(--negative)"}`,
                  background: chapterScore >= 0 ? "rgba(64, 192, 128, 0.04)" : "rgba(224, 80, 80, 0.04)",
                  marginBottom: "0.5rem",
                  borderRadius: "0 var(--radius) var(--radius) 0",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {t(`chapter.theme.${ch.theme}`) || ch.theme?.replace(/_/g, " ")}
                    </span>
                    <span className={chapterScore >= 0 ? "score-positive" : "score-negative"}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      {chapterScore > 0 ? "+" : ""}{chapterScore} pts
                    </span>
                  </div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                    {ch.decisions.length} {ch.decisions.length === 1 ? "decision" : "decisions"} — {ch.decisions[0]?.nodeTitle}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Full decision history (collapsible) */}
      <JourneyDetails history={gameState.history} t={t} />

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

function JourneyDetails({ history, t }) {
  const [expanded, setExpanded] = useState(false);

  if (!history || history.length === 0) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <button
        className="btn"
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", fontSize: "0.85rem", marginBottom: expanded ? "1rem" : 0 }}
      >
        {expanded ? t("end.hideFullJourney") : t("end.showFullJourney")}
      </button>
      {expanded && (
        <div>
          <h3>{t("end.journey")}</h3>
          {history.map((h, i) => (
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
      )}
    </div>
  );
}
