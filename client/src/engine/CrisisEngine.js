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
  jeepney: [
    { en: "Daily boundary payment to operator: ₱1,200.", tl: "Boundary sa operator: ₱1,200.", cost: 1200 },
    { en: "Diesel for the week: ₱3,500.", tl: "Diesel ngayong linggo: ₱3,500.", cost: 3500 },
    { en: "Family expenses and Lola's medicine: ₱2,500.", tl: "Gastusin sa bahay at gamot ni Lola: ₱2,500.", cost: 2500 },
  ],
  vendor: [
    { en: "Ingredients and supplies for the week: ₱2,800.", tl: "Sangkap at gamit ngayong linggo: ₱2,800.", cost: 2800 },
    { en: "Rent for cart storage overnight: ₱500.", tl: "Upa sa pagpapagarahe ng kariton: ₱500.", cost: 500 },
    { en: "Children's school expenses: ₱1,500.", tl: "Gastusin ng mga anak sa eskwela: ₱1,500.", cost: 1500 },
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

// Positive events that trigger when stats are healthy (symmetric to crises)
const BOOST_POOLS = {
  generic: {
    social: [
      { en: "A coworker thanks you for speaking up at the meeting. You feel less alone.", tl: "Nagpasalamat ang isang katrabaho dahil nagsalita ka sa meeting. Hindi ka na nag-iisa.", confidenceGain: 3, wellbeingGain: 2 },
      { en: "A neighbor asks for your advice about a workplace problem. Your knowledge matters.", tl: "Humingi ng payo ang kapitbahay mo tungkol sa problema sa trabaho. Mahalaga ang kaalaman mo.", confidenceGain: 4, wellbeingGain: 1 },
      { en: "You slept well for the first time in weeks. Small wins count.", tl: "Nakatulog ka nang mahimbing sa unang pagkakataon sa ilang linggo. Mahalaga ang maliliit na panalo.", confidenceGain: 1, wellbeingGain: 4 },
    ],
    financial: [
      { en: "A relative paid back ₱500 they owed you. Every bit helps.", tl: "Nagbayad ang kamag-anak mo ng ₱500 na utang. Malaking tulong kahit maliit.", peraGain: 500, wellbeingGain: 1 },
      { en: "You found a cheaper route to work this month. Saved ₱300.", tl: "Nakahanap ka ng mas murang ruta papasok. Nakatipid ka ng ₱300.", peraGain: 300, wellbeingGain: 1 },
    ],
  },
  ofw: {
    social: [
      { en: "Your family sent a video message. Miguel is doing well in school.", tl: "Nagpadala ng video message ang pamilya mo. Magaling si Miguel sa school.", confidenceGain: 2, wellbeingGain: 5 },
    ],
  },
  rider: {
    social: [
      { en: "A regular customer gave you a ₱100 tip and a thank you note.", tl: "Binigyan ka ng ₱100 tip at thank you note ng suki mo.", peraGain: 100, confidenceGain: 2, wellbeingGain: 2 },
    ],
  },
  bpo: {
    social: [
      { en: "Your team hit their metrics this month. The team lead acknowledged your effort.", tl: "Naabot ng team mo ang target ngayong buwan. Kinilala ng team lead ang effort mo.", confidenceGain: 4, wellbeingGain: 2 },
    ],
  },
  construction: {
    social: [
      { en: "The foreman noticed your careful work and told the others to follow your example.", tl: "Napansin ng foreman ang maayos mong trabaho at sinabi sa iba na tularan ka.", confidenceGain: 5, wellbeingGain: 1 },
    ],
  },
  driver: {
    social: [
      { en: "Lorna packed your favorite lunch today. You ate well for once.", tl: "Naghanda si Lorna ng paborito mong baon. Kumain ka nang maayos.", confidenceGain: 1, wellbeingGain: 4 },
    ],
  },
  maid: {
    social: [
      { en: "The children in the household drew you a thank-you card. It made your day.", tl: "Gumawa ng thank-you card para sa iyo ang mga bata sa bahay. Naging masaya ang araw mo.", confidenceGain: 3, wellbeingGain: 3 },
    ],
  },
  jeepney: {
    social: [
      { en: "A regular passenger thanks you for always waiting for seniors to sit down before driving. You feel seen.", tl: "Nagpasalamat ang isang suki dahil palagi kang naghihintay na makaupo ang mga matatanda bago magmaneho. Naramdaman mong pinapahalagahan ka.", confidenceGain: 3, wellbeingGain: 3 },
      { en: "Fellow drivers at the terminal share food with you. Solidarity on the road.", tl: "Nagbahaginan ng pagkain ang mga kapwa mo driver sa terminal. Damayan sa kalsada.", confidenceGain: 2, wellbeingGain: 3 },
    ],
    financial: [
      { en: "Good traffic today — you completed more trips than usual. Extra ₱400.", tl: "Magaan ang trapiko ngayon — mas marami kang natapos na biyahe. Dagdag ₱400.", peraGain: 400, wellbeingGain: 1 },
    ],
  },
  vendor: {
    social: [
      { en: "A suki tells you your fishball sauce is the best in the area. Small pride, big warmth.", tl: "Sinabi ng isang suki na pinakamasarap ang sarsa mo sa buong lugar. Maliit na papuri, malaking saya.", confidenceGain: 3, wellbeingGain: 3 },
      { en: "A fellow vendor watches your cart while you take a break. Community matters.", tl: "Binantayan ng kapwa mo tindera ang kariton mo habang nagpapahinga ka. Mahalaga ang komunidad.", confidenceGain: 2, wellbeingGain: 3 },
    ],
    financial: [
      { en: "Sold out early today! Extra ₱350 in profit.", tl: "Naubos agad ang paninda ngayon! Dagdag ₱350 na kita.", peraGain: 350, wellbeingGain: 2 },
    ],
  },
};

/**
 * Roll for a morale boost event based on stats.
 * Triggers when confidence > 55 or wellbeing > 55 (things are going okay).
 * Returns null (no boost) or a boost event object.
 */
export function rollForBoost(stats, characterId) {
  // Only trigger when at least one stat is in a good place
  const { confidence, wellbeing } = stats;
  if (confidence <= 55 && wellbeing <= 55) return null;

  // 15% chance per eligible node
  if (Math.random() > 0.15) return null;

  // Pick pool type: financial boost if confidence is high, social if wellbeing is high
  const poolType = confidence > wellbeing ? "social" : (Math.random() > 0.5 ? "financial" : "social");

  // Try character-specific pool first, fall back to generic
  const charPool = BOOST_POOLS[characterId];
  const genericPool = BOOST_POOLS.generic;
  const pool = (charPool && charPool[poolType]) || genericPool[poolType] || genericPool.social;
  if (!pool || pool.length === 0) return null;

  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

/**
 * Apply debt interest when in debt during an expense cycle.
 */
export function applyDebtInterest(currentPera) {
  if (currentPera >= 0) return 0;
  const interest = Math.round(Math.abs(currentPera) * DEBT_INTEREST_RATE);
  return -interest; // Additional debt from interest
}
