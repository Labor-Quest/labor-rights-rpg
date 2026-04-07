const API_BASE = "/api";

export async function fetchCharacters(locale) {
  const params = locale ? `?locale=${locale}` : "";
  const res = await fetch(`${API_BASE}/characters${params}`);
  if (!res.ok) throw new Error("Failed to load characters");
  return res.json();
}

export async function fetchScenarios(characterId, locale) {
  const params = locale ? `?locale=${locale}` : "";
  const res = await fetch(`${API_BASE}/scenarios/${characterId}${params}`);
  if (!res.ok) throw new Error(`Failed to load scenarios for ${characterId}`);
  return res.json();
}

export async function fetchResources() {
  const res = await fetch(`${API_BASE}/resources`);
  if (!res.ok) throw new Error("Failed to load resources");
  return res.json();
}
