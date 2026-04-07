/**
 * Economic Pressure System
 * Monthly expenses drain money. Low wellbeing triggers crisis events.
 * Debt locks out legal action choices.
 */

export const EXPENSE_INTERVAL = 5; // nodes between expense events
export const DEBT_INTEREST_RATE = 0.20; // 20% per expense cycle (5-6 lending)

// Monthly expenses per character (rotated randomly)
export const EXPENSE_EVENTS = {
  ofw: [
    { en: "Remittance to family: ₱3,500 for Nanay's medicine and Miguel's tuition.", tl: "Padala sa pamilya: ₱3,500 para sa gamot ni Nanay at tuition ni Miguel.", cost: 3500 },
    { en: "Monthly savings for emergency fund: ₱1,500.", tl: "Monthly ipon para sa emergency fund: ₱1,500.", cost: 1500 },
  ],
  rider: [
    { en: "Honda TMX motorcycle installment: ₱4,800.", tl: "Installment ng Honda TMX: ₱4,800.", cost: 4800 },
    { en: "Share for household expenses: ₱3,500.", tl: "Ambag sa bahay: ₱3,500.", cost: 3500 },
  ],
  bpo: [
    { en: "Apartment rent in Makati: ₱5,000.", tl: "Renta ng apartment sa Makati: ₱5,000.", cost: 5000 },
    { en: "Food and transport for the month: ₱2,000.", tl: "Pagkain at pamasahe ngayong buwan: ₱2,000.", cost: 2000 },
  ],
  construction: [
    { en: "Family expenses in Cebu: ₱4,000.", tl: "Gastusin ng pamilya sa Cebu: ₱4,000.", cost: 4000 },
    { en: "Kids' school supplies and baon: ₱2,000.", tl: "School supplies at baon ng mga bata: ₱2,000.", cost: 2000 },
  ],
  driver: [
    { en: "Household expenses in QC: ₱4,500.", tl: "Gastusin sa bahay sa QC: ₱4,500.", cost: 4500 },
    { en: "Lorna's high blood pressure medication: ₱2,000.", tl: "Gamot ni Lorna sa high blood: ₱2,000.", cost: 2000 },
  ],
  maid: [
    { en: "Money sent home to Samar for medicine and tuition: ₱2,000.", tl: "Padala sa Samar para sa gamot at tuition: ₱2,000.", cost: 2000 },
  ],
};

// Crisis events by severity tier, per character
const CRISIS_POOLS = {
  generic: {
    minor: [
      { en: "You had a bad headache and bought medicine at Mercury Drug.", tl: "Sumakit ang ulo mo. Bumili ka ng gamot sa Mercury Drug.", cost: 500, wellbeingLoss: 3 },
      { en: "You skipped meals to save money. Your body feels weak.", tl: "Hindi ka kumain para makatipid. Nanghihina ang katawan mo.", cost: 150, wellbeingLoss: 2 },
    ],
    moderate: [
      { en: "You got sick and couldn't work for a day. Lost income and paid for medicine.", tl: "Nilagnat ka at hindi nakapagtrabaho ng isang araw. Nawalan ng kita at bumili ng gamot.", cost: 1500, wellbeingLoss: 5, confidenceLoss: 3 },
    ],
    severe: [
      { en: "You collapsed from exhaustion. Emergency room visit: ₱5,000.", tl: "Natumba ka sa sobrang pagod. Emergency room: ₱5,000.", cost: 5000, wellbeingLoss: 8, forceWorstChoice: true },
    ],
  },
  rider: {
    minor: [
      { en: "Back pain from riding all day. Bought pain patches: ₱350.", tl: "Sumakit ang likod mo sa buong araw na pagmamaneho. Bumili ka ng pain patch: ₱350.", cost: 350, wellbeingLoss: 3 },
    ],
    moderate: [
      { en: "Near-miss accident left you shaking. You couldn't ride for 2 days.", tl: "Halos maaksidente ka. Hindi ka nakapag-ride ng 2 araw dahil sa kaba.", cost: 1800, wellbeingLoss: 6, confidenceLoss: 4 },
    ],
    severe: [
      { en: "Minor accident — scraped knee and damaged phone mount. ₱4,500 total.", tl: "Na-minor accident ka — gasgas sa tuhod at nasira ang phone mount. ₱4,500 lahat.", cost: 4500, wellbeingLoss: 10, forceWorstChoice: true },
    ],
  },
  maid: {
    minor: [
      { en: "Your hands are cracked from washing clothes without gloves.", tl: "Nagka-crack ang kamay mo sa kakapalaba nang walang gloves.", cost: 200, wellbeingLoss: 3 },
    ],
    moderate: [
      { en: "Severe back pain from carrying heavy laundry baskets. Needed a check-up.", tl: "Sobrang sakit ng likod mo sa pagbubuhat ng mabibigat na labada. Kailangan mo ng check-up.", cost: 1200, wellbeingLoss: 6, confidenceLoss: 2 },
    ],
    severe: [
      { en: "You fainted in the kitchen from overwork. The employer drove you to a clinic.", tl: "Nahimatay ka sa kusina dahil sa sobrang pagod. Dinala ka ng amo sa clinic.", cost: 3000, wellbeingLoss: 12, forceWorstChoice: true },
    ],
  },
};

/**
 * Get a random expense event for this character.
 */
export function getExpenseEvent(characterId) {
  const pool = EXPENSE_EVENTS[characterId] || EXPENSE_EVENTS.driver;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Roll for a crisis event based on wellbeing level.
 * Returns null (no crisis) or a crisis event object.
 */
export function rollForCrisis(wellbeing, characterId) {
  let chance = 0;
  let tier = null;

  if (wellbeing <= 9) { chance = 0.80; tier = "severe"; }
  else if (wellbeing <= 19) { chance = 0.50; tier = "severe"; }
  else if (wellbeing <= 29) { chance = 0.30; tier = "moderate"; }
  else if (wellbeing <= 40) { chance = 0.15; tier = "minor"; }
  else return null;

  if (Math.random() > chance) return null;

  // Try character-specific pool first, fall back to generic
  const charPool = CRISIS_POOLS[characterId];
  const genericPool = CRISIS_POOLS.generic;
  const pool = (charPool && charPool[tier]) || genericPool[tier];
  if (!pool || pool.length === 0) return null;

  return { ...pool[Math.floor(Math.random() * pool.length)], tier };
}

/**
 * Apply debt interest when in debt during an expense cycle.
 */
export function applyDebtInterest(currentPera) {
  if (currentPera >= 0) return 0;
  const interest = Math.round(Math.abs(currentPera) * DEBT_INTEREST_RATE);
  return -interest; // Additional debt from interest
}
