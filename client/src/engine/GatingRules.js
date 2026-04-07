/**
 * Choice Gating Rules
 * Determines which choices are available based on player stats.
 * Only high-score "assert your rights" choices get gated.
 * The player can ALWAYS submit to exploitation.
 */

const GATING_RULES = [
  {
    // Assert rights in legal-themed scenarios
    matchThemes: [
      "misclassification", "wage_theft", "no_contract", "contractualization",
      "kasambahay_law", "employer_employee_test", "no_benefits",
      "illegal_deductions", "unfair_deductions",
    ],
    minScore: 10,
    requires: { confidence: 40 },
    lockedKey: "gate.needConfidence",
  },
  {
    // File formal complaints — requires money AND confidence
    matchThemes: [
      "misclassification", "wage_theft", "contractualization",
      "kasambahay_law", "employer_employee_test", "no_benefits",
    ],
    minScore: 13,
    requires: { confidence: 60, pera: 3000 },
    lockedKey: "gate.needMoneyAndConfidence",
  },
  {
    // Union organizing
    matchThemes: ["union_busting"],
    minScore: 8,
    requires: { confidence: 50 },
    lockedKey: "gate.needCourage",
  },
  {
    // Refuse unsafe/abusive conditions
    matchThemes: ["unsafe_conditions", "health_hazards", "forced_overtime", "abuse"],
    minScore: 10,
    requires: { wellbeing: 30 },
    lockedKey: "gate.tooExhausted",
  },
  {
    // Debt lockout — can't afford any legal action
    matchThemes: null, // applies to all themes
    minScore: 10,
    requires: { pera: 0 }, // Must not be in debt
    lockedKey: "gate.inDebt",
  },
];

/**
 * Evaluate whether a choice is available given player stats.
 * Returns { available: true } or { available: false, lockedKey, requirements }
 */
export function evaluateChoice(choice, theme, stats) {
  const score = choice.scoreChange || 0;

  // Low-score choices are NEVER gated — exploitation is always accessible
  if (score < 8) return { available: true };

  for (const rule of GATING_RULES) {
    // Check theme match (null = all themes)
    if (rule.matchThemes && !rule.matchThemes.includes(theme)) continue;

    // Check score range
    if (score < rule.minScore) continue;

    // Check stat requirements
    let meetsAll = true;
    const unmet = {};
    for (const [stat, minVal] of Object.entries(rule.requires)) {
      const current = stats[stat] ?? 0;
      if (current < minVal) {
        meetsAll = false;
        unmet[stat] = { current, required: minVal };
      }
    }

    if (!meetsAll) {
      return { available: false, lockedKey: rule.lockedKey, requirements: unmet };
    }
  }

  return { available: true };
}

/**
 * Evaluate all choices on a node. Guarantees at least one is available.
 * If all would be gated, forcibly unlocks the lowest-score choice.
 */
export function evaluateAllChoices(choices, theme, stats) {
  if (!choices || choices.length === 0) return [];

  const results = choices.map((choice) => ({
    choice,
    ...evaluateChoice(choice, theme, stats),
  }));

  // Guarantee: if all gated, unlock the lowest-score choice
  const anyAvailable = results.some((r) => r.available);
  if (!anyAvailable) {
    let lowestIdx = 0;
    let lowestScore = Infinity;
    results.forEach((r, i) => {
      const s = r.choice.scoreChange || 0;
      if (s < lowestScore) {
        lowestScore = s;
        lowestIdx = i;
      }
    });
    results[lowestIdx] = { choice: results[lowestIdx].choice, available: true, forced: true };
  }

  return results;
}
