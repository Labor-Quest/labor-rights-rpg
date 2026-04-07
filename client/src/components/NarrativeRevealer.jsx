import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

// Split long paragraphs at sentence boundaries for readability
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

export default function NarrativeRevealer({ text, nodeId, quickMode, onFullyRevealed }) {
  const { t } = useLanguage();
  const paragraphs = splitLongParagraphs(text);
  const [visibleCount, setVisibleCount] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const allRevealed = visibleCount >= paragraphs.length;

  // Reset when node changes
  useEffect(() => {
    setVisibleCount(1);
    setExpanded(false);
  }, [nodeId]);

  // Notify parent when fully revealed
  useEffect(() => {
    if (allRevealed) onFullyRevealed?.();
  }, [allRevealed]);

  // Quick mode: show first paragraph only, with expand option
  if (quickMode && !expanded && paragraphs.length > 1) {
    return (
      <div className="narrative">
        <p className="narrative-paragraph-reveal">{paragraphs[0]}</p>
        <button
          className="narrative-skip"
          onClick={() => { setExpanded(true); setVisibleCount(paragraphs.length); }}
        >
          {t("narrative.readMore")} ({paragraphs.length - 1} {t("narrative.more")})
        </button>
        {/* In quick mode, choices appear immediately */}
      </div>
    );
  }

  function handleContinue() {
    setVisibleCount((prev) => Math.min(prev + 1, paragraphs.length));
  }

  function handleShowAll() {
    setVisibleCount(paragraphs.length);
  }

  return (
    <div className="narrative">
      {paragraphs.slice(0, visibleCount).map((paragraph, i) => (
        <p
          key={`${nodeId}-${i}`}
          className={i === visibleCount - 1 ? "narrative-paragraph-reveal" : ""}
        >
          {paragraph}
        </p>
      ))}

      {!allRevealed && (
        <div className="narrative-controls">
          <button className="btn btn-primary narrative-continue-btn" onClick={handleContinue}>
            {t("narrative.continue")}
          </button>
          <div className="narrative-meta">
            <span className="narrative-progress">
              {visibleCount} / {paragraphs.length}
            </span>
            <button className="narrative-skip" onClick={handleShowAll}>
              {t("narrative.showAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
