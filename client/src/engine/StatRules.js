/**
 * RPG Stat Derivation Rules
 * Maps existing (theme, scoreChange) to multi-stat effects
 * without modifying any JSON scenario data.
 */

export const CHARACTER_STARTING_STATS = {
  ofw:          { pera: 8000,  confidence: 50, wellbeing: 75 },
  rider:        { pera: 3000,  confidence: 50, wellbeing: 75 },
  bpo:          { pera: 12000, confidence: 50, wellbeing: 75 },
  construction: { pera: 5000,  confidence: 50, wellbeing: 75 },
  driver:       { pera: 7000,  confidence: 50, wellbeing: 75 },
  maid:         { pera: 1500,  confidence: 50, wellbeing: 75 },
  jeepney:      { pera: 4000,  confidence: 50, wellbeing: 75 },
  vendor:       { pera: 2000,  confidence: 50, wellbeing: 75 },
};

// How each theme distributes scoreChange across the three stats
const THEME_WEIGHTS = {
  wage_theft:             { pera: 0.7,  confidence: 0.2, wellbeing: 0.1 },
  no_contract:            { pera: 0.2,  confidence: 0.5, wellbeing: 0.3 },
  unsafe_conditions:      { pera: 0.1,  confidence: 0.2, wellbeing: 0.7 },
  no_benefits:            { pera: 0.5,  confidence: 0.3, wellbeing: 0.2 },
  misclassification:      { pera: 0.3,  confidence: 0.5, wellbeing: 0.2 },
  contractualization:     { pera: 0.4,  confidence: 0.4, wellbeing: 0.2 },
  union_busting:          { pera: 0.1,  confidence: 0.7, wellbeing: 0.2 },
  recruitment_scams:      { pera: 0.8,  confidence: 0.1, wellbeing: 0.1 },
  health_hazards:         { pera: 0.1,  confidence: 0.1, wellbeing: 0.8 },
  abuse:                  { pera: 0.0,  confidence: 0.3, wellbeing: 0.7 },
  forced_overtime:        { pera: 0.2,  confidence: 0.2, wellbeing: 0.6 },
  kasambahay_law:         { pera: 0.3,  confidence: 0.4, wellbeing: 0.3 },
  algorithmic_management: { pera: 0.4,  confidence: 0.4, wellbeing: 0.2 },
  document_confiscation:  { pera: 0.1,  confidence: 0.6, wellbeing: 0.3 },
  contract_substitution:  { pera: 0.5,  confidence: 0.3, wellbeing: 0.2 },
  overtime:               { pera: 0.3,  confidence: 0.2, wellbeing: 0.5 },
  employer_employee_test: { pera: 0.2,  confidence: 0.6, wellbeing: 0.2 },
  accident_liability:     { pera: 0.5,  confidence: 0.2, wellbeing: 0.3 },
  unfair_deductions:      { pera: 0.8,  confidence: 0.1, wellbeing: 0.1 },
  illegal_deductions:     { pera: 0.8,  confidence: 0.1, wellbeing: 0.1 },
  boundary_system:        { pera: 0.7,  confidence: 0.2, wellbeing: 0.1 },
  franchise_rights:       { pera: 0.3,  confidence: 0.5, wellbeing: 0.2 },
  modernization:          { pera: 0.5,  confidence: 0.3, wellbeing: 0.2 },
  fare_disputes:          { pera: 0.6,  confidence: 0.2, wellbeing: 0.2 },
  informal_economy:       { pera: 0.5,  confidence: 0.3, wellbeing: 0.2 },
  local_ordinance:        { pera: 0.3,  confidence: 0.4, wellbeing: 0.3 },
  demolition:             { pera: 0.6,  confidence: 0.3, wellbeing: 0.1 },
  vendor_rights:          { pera: 0.3,  confidence: 0.5, wellbeing: 0.2 },
};

const DEFAULT_WEIGHTS = { pera: 0.33, confidence: 0.34, wellbeing: 0.33 };

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Derive stat changes from an existing choice's scoreChange + theme.
 * Losses are amplified (x300 vs x150) because mistakes cost more than wins pay.
 */
export function deriveStatChanges(theme, scoreChange) {
  const weights = THEME_WEIGHTS[theme] || DEFAULT_WEIGHTS;

  const peraMultiplier = scoreChange >= 0 ? 150 : 300;
  const peraChange = Math.round(scoreChange * weights.pera * peraMultiplier);
  const confidenceChange = Math.round(scoreChange * weights.confidence * 0.5);
  const wellbeingChange = Math.round(scoreChange * weights.wellbeing * 0.4);

  return { pera: peraChange, confidence: confidenceChange, wellbeing: wellbeingChange };
}

/**
 * Apply stat changes to current stats, clamping confidence and wellbeing.
 */
export function applyStatChanges(currentStats, changes) {
  return {
    pera: currentStats.pera + changes.pera, // Allow negative (debt)
    confidence: clamp(currentStats.confidence + changes.confidence, 0, 100),
    wellbeing: clamp(currentStats.wellbeing + changes.wellbeing, 0, 100),
  };
}
