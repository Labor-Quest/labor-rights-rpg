import { useLanguage } from "../context/LanguageContext.jsx";

const LINKS = [
  { name: "DOLE", desc: "Department of Labor and Employment", url: "https://dole.gov.ph" },
  { name: "DMW (formerly POEA)", desc: "Department of Migrant Workers", url: "https://dmw.gov.ph" },
  { name: "NLRC", desc: "National Labor Relations Commission", url: "https://nlrc.dole.gov.ph" },
  { name: "OWWA", desc: "Overseas Workers Welfare Administration", url: "https://owwa.gov.ph" },
  { name: "PAO", desc: "Public Attorney's Office (free legal aid)", url: "https://pao.gov.ph" },
];

export default function AboutScreen() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>{t("about.title")}</h1>

      {/* What this is */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>{t("about.whatTitle")}</h3>
        <p>{t("about.whatBody")}</p>
      </div>

      {/* Why it was built */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>{t("about.whyTitle")}</h3>
        <p>{t("about.whyBody1")}</p>
        <p>{t("about.whyBody2")}</p>
      </div>

      {/* Government & legal resources */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>{t("about.resourcesTitle")}</h3>
        <p style={{ marginBottom: "1rem" }}>{t("about.resourcesDesc")}</p>
        {LINKS.map((link) => (
          <div key={link.name} className="resource-card">
            <h4>{link.name}</h4>
            <p style={{ marginBottom: "0.3rem", fontSize: "0.85rem" }}>{link.desc}</p>
            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--info)", fontSize: "0.85rem" }}>
              {link.url}
            </a>
          </div>
        ))}
      </div>

      {/* Contact / partnership */}
      <div style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        border: "1px solid var(--accent)",
        borderRadius: "var(--radius)",
        background: "rgba(240, 192, 64, 0.05)"
      }}>
        <h3>{t("about.partnerTitle")}</h3>
        <p>{t("about.partnerBody")}</p>
        <p style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: "0.95rem" }}>
          hello@laborquest.app
        </p>
      </div>
    </div>
  );
}
