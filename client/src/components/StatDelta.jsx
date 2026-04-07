import { useState, useEffect } from "react";

/**
 * Floating stat change animation.
 * Shows "+₱2,500" or "-5" floating up and fading out.
 */
export default function StatDelta({ value, prefix = "", suffix = "" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || value === 0) return null;

  const isPositive = value > 0;
  const display = `${isPositive ? "+" : ""}${prefix}${value.toLocaleString()}${suffix}`;

  return (
    <span className={`stat-delta ${isPositive ? "stat-delta-positive" : "stat-delta-negative"}`}>
      {display}
    </span>
  );
}
