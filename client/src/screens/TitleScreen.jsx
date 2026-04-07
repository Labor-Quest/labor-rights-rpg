import { useLanguage } from "../context/LanguageContext.jsx";

export default function TitleScreen({ onStart }) {
  const { t } = useLanguage();

  return (
    <div style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h3>{t("title.subtitle")}</h3>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        {t("app.title")}
      </h1>
      <p style={{ maxWidth: "480px", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
        {t("title.tagline")}
      </p>

      <div style={{ marginBottom: "3rem" }}>
        <button className="btn btn-primary" onClick={onStart} style={{ fontSize: "1.1rem", padding: "1rem 2.5rem" }}>
          {t("title.start")}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
        {[
          { label: t("title.characters"), detail: t("title.characters.detail") },
          { label: t("title.scenarios"), detail: t("title.scenarios.detail") },
          { label: t("title.laws"), detail: t("title.laws.detail") },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "0.9rem" }}>
              {item.label}
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
