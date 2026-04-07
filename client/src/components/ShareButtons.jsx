import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const SHARE_URL = "https://laborquest.app";

export default function ShareButtons({ character, grade }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const shareText = t("share.message")
    .replace("{character}", character?.name || "")
    .replace("{grade}", grade || "");

  function handleCopy() {
    navigator.clipboard.writeText(`${shareText} ${SHARE_URL}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  }

  function handleTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  }

  return (
    <div style={{
      marginTop: "2rem",
      padding: "1.5rem",
      border: "2px solid var(--accent)",
      borderRadius: "var(--radius)",
      background: "rgba(240, 192, 64, 0.05)",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--accent)",
        marginBottom: "0.75rem",
        fontWeight: 600,
      }}>
        {t("share.heading")}
      </div>
      <p style={{
        fontSize: "0.9rem",
        color: "var(--text-secondary)",
        marginBottom: "1.25rem",
        lineHeight: 1.5,
      }}>
        {shareText}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={handleCopy} style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}>
          {copied ? t("share.copied") : t("share.copy")}
        </button>
        <button className="btn" onClick={handleFacebook} style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}>
          Facebook
        </button>
        <button className="btn" onClick={handleTwitter} style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}>
          X / Twitter
        </button>
      </div>
    </div>
  );
}
