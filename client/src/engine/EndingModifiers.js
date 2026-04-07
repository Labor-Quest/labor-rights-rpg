/**
 * Stat-Based Ending Modifiers
 * Classifies final stats into a 3x3x3 grid and provides
 * a short epilogue paragraph that contextualizes the ending.
 */

export function classifyEnding(stats) {
  const financial = stats.pera >= 10000 ? "stable" : stats.pera >= 0 ? "surviving" : "indebted";
  const agency = stats.confidence >= 70 ? "empowered" : stats.confidence >= 40 ? "aware" : "broken";
  const health = stats.wellbeing >= 60 ? "healthy" : stats.wellbeing >= 30 ? "worn" : "shattered";
  return { financial, agency, health };
}

// Key epilogue combinations (most impactful contrasts)
const EPILOGUES = {
  "stable_empowered_healthy": {
    en: "You emerged with your finances intact, your spirit unbroken, and your health preserved. Few workers manage to navigate the system this well. You know how rare that is — and that knowledge is its own responsibility.",
    tl: "Lumabas ka na buo ang bulsa, matapang ang loob, at malusog ang katawan. Iilan lang ang manggagawang nakakalusot nang ganito sa sistema. Alam mo kung gaano ito kabihira — at ang kaalamang iyon ay sarili nitong responsibilidad."
  },
  "stable_empowered_worn": {
    en: "You won the fight and kept your money, but your body paid the price. The victory is real — but so is the exhaustion. Take care of yourself. You've earned it.",
    tl: "Nanalo ka sa laban at napanatili ang pera mo, pero nagbayad ang katawan mo. Totoo ang tagumpay — pero totoo rin ang pagkapagod. Alagaan mo ang sarili mo. Deserve mo 'yan."
  },
  "stable_aware_healthy": {
    en: "You played it smart — not every battle, but the right ones. You're financially stable and healthy, with enough knowledge to help others. Sometimes wisdom is knowing which fights to pick.",
    tl: "Matalino ang laro mo — hindi lahat ng laban, pero ang mga tamang laban. Stable ka sa pera at malusog, may sapat na kaalaman para tulungan ang iba. Minsan, karunungan ang malaman kung aling laban ang lalabanan."
  },
  "surviving_empowered_worn": {
    en: "You fought hard and won your dignity, even if the money isn't great and your body is tired. You proved that workers can stand up. The system didn't break you.",
    tl: "Lumaban ka nang mabuti at nanalo ang dignidad mo, kahit hindi maganda ang pera at pagod ang katawan. Pinatunayan mong kaya ng manggagawa na tumindig. Hindi ka binasag ng sistema."
  },
  "surviving_aware_healthy": {
    en: "You're getting by. Not rich, not powerful, but aware and alive. You know your rights now. That knowledge is a shield for next time — and there will be a next time.",
    tl: "Nakakaraos ka. Hindi mayaman, hindi makapangyarihan, pero mulat at buhay. Alam mo na ang mga karapatan mo. Ang kaalamang iyan ay kalasag para sa susunod — at magkakaroon ng susunod."
  },
  "indebted_empowered_healthy": {
    en: "You stood up for your rights and it cost you money — deep in debt from legal fees and lost income. But your dignity is intact. The debt is temporary. The courage you built is permanent.",
    tl: "Tumayo ka para sa karapatan mo at nagastos ka — lubog sa utang dahil sa legal fees at nawalan ng kita. Pero buo ang dignidad mo. Pansamantala lang ang utang. Permanente ang tapang na itinayo mo."
  },
  "indebted_broken_shattered": {
    en: "Deep in debt, too beaten down to fight, health failing. This is not a failure of character — this is what the system does to workers without a safety net. The question is not why you fell. The question is why the net was never there.",
    tl: "Lubog sa utang, walang lakas ng loob na lumaban, bumabagsak ang kalusugan. Hindi ito pagkabigo ng pagkatao — ito ang ginagawa ng sistema sa mga manggagawang walang safety net. Ang tanong ay hindi kung bakit ka bumagsak. Ang tanong ay kung bakit walang safety net."
  },
  "indebted_aware_shattered": {
    en: "You know your rights now, but knowing isn't enough when your body is broken and the debt collectors are calling. The awareness hurts more — because now you see clearly what was taken from you.",
    tl: "Alam mo na ang mga karapatan mo, pero hindi sapat ang kaalaman kapag sira na ang katawan mo at tumatawag ang mga nagpapautang. Mas masakit ang kamulatan — dahil ngayon, malinaw mong nakikita ang kinuha sa iyo."
  },
  "surviving_broken_shattered": {
    en: "You survived, barely. Money is tight, confidence gone, body worn. But you're still here. Sometimes just surviving the system is its own kind of strength. Rest. Then figure out the next step.",
    tl: "Nakaligtas ka, halos hindi. Kapos sa pera, wala nang tapang, pagod ang katawan. Pero nandito ka pa rin. Minsan, ang makaligtas lang sa sistema ay sarili na nitong lakas. Magpahinga ka. Tapos isipin ang susunod na hakbang."
  },
};

// Fallback for combinations without specific text
const FALLBACKS = {
  stable:    { en: "Financially, you came out ahead.", tl: "Sa pera, maganda ang labas mo." },
  surviving: { en: "You're getting by, though it's tight.", tl: "Nakakaraos ka, kahit mahirap." },
  indebted:  { en: "The debt weighs heavy.", tl: "Mabigat ang utang." },
  empowered: { en: "Your confidence to assert your rights has grown.", tl: "Lumakas ang tapang mong ipaglaban ang karapatan." },
  aware:     { en: "You know more than before, even if you couldn't always act.", tl: "Mas marami kang alam kaysa dati, kahit hindi mo palaging nagawa." },
  broken:    { en: "The fight took more from you than it gave.", tl: "Mas maraming kinuha sa iyo ang laban kaysa ibinigay." },
  healthy:   { en: "At least your health held up.", tl: "At least napanatili ang kalusugan mo." },
  worn:      { en: "Your body remembers every hard day.", tl: "Natatandaan ng katawan mo ang bawat mabigat na araw." },
  shattered: { en: "Your health paid the highest price.", tl: "Ang kalusugan mo ang nagbayad ng pinakamahal." },
};

/**
 * Get the epilogue text for an ending based on final stats.
 */
export function getEpilogue(stats, locale) {
  const { financial, agency, health } = classifyEnding(stats);
  const key = `${financial}_${agency}_${health}`;
  const lang = locale === "tl" ? "tl" : "en";

  // Try specific combination first
  if (EPILOGUES[key]) {
    return EPILOGUES[key][lang];
  }

  // Fallback: compose from individual axis descriptions
  return [
    FALLBACKS[financial]?.[lang] || "",
    FALLBACKS[agency]?.[lang] || "",
    FALLBACKS[health]?.[lang] || "",
  ].filter(Boolean).join(" ");
}
