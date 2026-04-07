const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_DIR = path.resolve(__dirname, "../../../data/scenarios");

// Whitelist of allowed character IDs — prevents path traversal
const VALID_CHARACTERS = new Set([
  "ofw", "rider", "bpo", "construction", "driver", "maid"
]);

// Whitelist of allowed locales — prevents injection via locale param
const VALID_LOCALES = new Set(["en", "tl"]);

// Helper: try locale-specific file first, fall back to default
function readJsonWithLocale(baseName, locale) {
  // Only allow whitelisted locales
  if (locale && VALID_LOCALES.has(locale) && locale !== "en") {
    const localePath = path.join(DATA_DIR, `${baseName}.${locale}.json`);
    // Verify resolved path is still inside DATA_DIR
    if (!path.resolve(localePath).startsWith(DATA_DIR)) {
      return null;
    }
    if (fs.existsSync(localePath)) {
      return JSON.parse(fs.readFileSync(localePath, "utf-8"));
    }
  }
  const defaultPath = path.join(DATA_DIR, `${baseName}.json`);
  if (!path.resolve(defaultPath).startsWith(DATA_DIR)) {
    return null;
  }
  if (fs.existsSync(defaultPath)) {
    return JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
  }
  return null;
}

// GET /api/characters — list available characters
router.get("/characters", (req, res) => {
  const locale = req.query.locale;
  if (locale && !VALID_LOCALES.has(locale)) {
    return res.status(400).json({ error: "Invalid locale" });
  }
  const data = readJsonWithLocale("characters", locale);
  if (!data) {
    return res.status(404).json({ error: "Characters data not found" });
  }
  res.json(data);
});

// GET /api/scenarios/:characterId — get full scenario tree for a character
router.get("/scenarios/:characterId", (req, res) => {
  const { characterId } = req.params;
  const locale = req.query.locale;

  // Strict whitelist check — blocks path traversal entirely
  if (!VALID_CHARACTERS.has(characterId)) {
    return res.status(400).json({ error: "Invalid character" });
  }
  if (locale && !VALID_LOCALES.has(locale)) {
    return res.status(400).json({ error: "Invalid locale" });
  }

  const data = readJsonWithLocale(characterId, locale);
  if (!data) {
    return res.status(404).json({ error: "Scenario not found" });
  }
  res.json(data);
});

// GET /api/resources — legal resources and helplines
router.get("/resources", (req, res) => {
  const resourcesPath = path.join(DATA_DIR, "resources.json");
  if (!fs.existsSync(resourcesPath)) {
    return res.status(404).json({ error: "Resources data not found" });
  }
  const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf-8"));
  res.json(resources);
});

module.exports = router;
