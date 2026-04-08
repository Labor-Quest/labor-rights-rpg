import { useState, useEffect, useRef } from "react";
import { fetchCharacters } from "../engine/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const ROLE_ICONS = {
  ofw: "\u2708",
  rider: "\u26A1",
  bpo: "\u260E",
  construction: "\u2692",
  driver: "\uD83D\uDE97",
  maid: "\uD83C\uDFE0",
  jeepney: "\uD83D\uDE90",
  vendor: "\uD83C\uDF62",
};

const CATEGORIES = [
  { id: "domestic", icon: "\uD83C\uDFE0" },
  { id: "overseas", icon: "\uD83C\uDF0F" },
  { id: "gig", icon: "\u26A1" },
  { id: "office", icon: "\uD83C\uDFE2" },
  { id: "industrial", icon: "\u2692" },
  { id: "transport", icon: "\uD83D\uDE8C" },
  { id: "informal", icon: "\uD83D\uDED2" },
];

export default function CharacterSelect({ onSelect, highlightId }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const { t, locale } = useLanguage();
  const highlightRef = useRef(null);

  useEffect(() => {
    fetchCharacters(locale)
      .then((data) => {
        setCharacters(data.characters);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [locale]);

  // Scroll to highlighted character from deep link
  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, highlightId]);

  if (loading) return <div className="loading">{t("loading.characters")}</div>;
  if (error) return <div className="loading">{t("game.error")}: {error}</div>;

  // Group characters by category
  const grouped = {};
  for (const char of characters) {
    const cat = char.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(char);
  }

  const orderedCategories = [
    ...CATEGORIES.filter((c) => grouped[c.id]),
    ...(grouped.other ? [{ id: "other", icon: "\u2666" }] : []),
  ];

  function toggleCategory(catId) {
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  return (
    <div>
      <h3>{t("select.heading")}</h3>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        {t("select.subheading")}
      </h2>
      <p>{t("select.description")}</p>

      {orderedCategories.map((cat) => (
        <div key={cat.id} className="category-section">
          <div
            className="category-header"
            onClick={() => toggleCategory(cat.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleCategory(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            <h3>{t(`category.${cat.id}`)}</h3>
            <span className={`category-chevron ${collapsed[cat.id] ? "collapsed" : ""}`}>
              {collapsed[cat.id] ? "\u25B6" : "\u25BC"}
            </span>
          </div>

          {!collapsed[cat.id] && (
            <div className="category-content">
              {grouped[cat.id].map((char) => (
                <div
                  key={char.id}
                  ref={char.id === highlightId ? highlightRef : undefined}
                  className={`card card-clickable${char.id === highlightId ? " card-highlight" : ""}`}
                  onClick={() => onSelect(char)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(char)}
                >
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{
                      fontSize: "2rem",
                      width: "3rem",
                      height: "3rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-hover)",
                      borderRadius: "var(--radius)",
                      flexShrink: 0,
                    }}>
                      {ROLE_ICONS[char.id] || "\u2666"}
                    </div>
                    <div>
                      <h2 style={{ marginBottom: "0.2rem" }}>{char.name}</h2>
                      <div className="badge" style={{ marginBottom: "0.5rem" }}>{char.role}</div>
                      <p style={{ marginBottom: 0, fontSize: "0.9rem" }}>{char.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
