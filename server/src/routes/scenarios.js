const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "../../../data/scenarios");

// Helper: try locale-specific file first, fall back to default
function readJsonWithLocale(baseName, locale) {
  if (locale && locale !== "en") {
    const localePath = path.join(DATA_DIR, `${baseName}.${locale}.json`);
    if (fs.existsSync(localePath)) {
      return JSON.parse(fs.readFileSync(localePath, "utf-8"));
    }
  }
  const defaultPath = path.join(DATA_DIR, `${baseName}.json`);
  if (fs.existsSync(defaultPath)) {
    return JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
  }
  return null;
}

// GET /api/characters — list available characters
router.get("/characters", (req, res) => {
  const locale = req.query.locale;
  const data = readJsonWithLocale("characters", locale);
  if (!data) {
    return res.status(404).json({ error: "Characters data not found. Run npm run generate first." });
  }
  res.json(data);
});

// GET /api/scenarios/:characterId — get full scenario tree for a character
router.get("/scenarios/:characterId", (req, res) => {
  const locale = req.query.locale;
  const data = readJsonWithLocale(req.params.characterId, locale);
  if (!data) {
    return res.status(404).json({ error: "Scenario not found" });
  }
  res.json(data);
});

// GET /api/resources — legal resources and helplines
router.get("/resources", (req, res) => {
  const resourcesPath = path.join(DATA_DIR, "resources.json");
  if (!fs.existsSync(resourcesPath)) {
    return res.status(404).json({ error: "Resources data not found. Run npm run generate first." });
  }
  const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf-8"));
  res.json(resources);
});

module.exports = router;
