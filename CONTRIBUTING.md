# Contributing to Labor Rights RPG

Thank you for your interest in helping Filipino workers learn their rights! Contributions in both **English** and **Filipino (Tagalog)** are welcome.

## How to Add a New Scenario Character

1. Add the character entry to `data/scenarios/characters.json` (and `characters.tl.json` for Tagalog) with: `id`, `name`, `role`, `description`, `avatar`, `themes`, `startNode`, `category`
2. Create `data/scenarios/{id}.json` with 30+ branching nodes (see format below)
3. Create `data/scenarios/{id}.tl.json` with the Tagalog translation (same node IDs)
4. Add the character's icon to `ROLE_ICONS` in `client/src/screens/CharacterSelect.jsx`
5. Add the character ID to `VALID_CHARACTERS` in `server/src/routes/scenarios.js`
6. Add starting money to `CHARACTER_STARTING_STATS` in `client/src/engine/StatRules.js`
7. Add expense/boost events in `client/src/engine/CrisisEngine.js`

### Scenario JSON Format

Each node follows this structure:

```json
{
  "nodes": {
    "node_id": {
      "id": "node_id",
      "title": "Scene title",
      "narrative": "2-4 paragraphs of story text",
      "theme": "wage_theft",
      "choices": [
        {
          "text": "What the player does",
          "nextNode": "next_node_id",
          "consequence": "What happens as a result",
          "scoreChange": -10,
          "knowledgeGained": "Legal fact the player learns (or null)"
        }
      ],
      "isEnding": false
    }
  },
  "startNode": "first_node_id"
}
```

### Writing Guidelines

- **Scenarios must be based on real Philippine labor laws** (Labor Code, RA 10361, RA 10022, etc.)
- **Choices should not be obvious** — include "trap choices" that sound right but backfire
- **Score range**: -10 to +15 per choice. High-score choices (8+) get stat-gated by the engine.
- **knowledgeGained**: Cite the specific law article when possible (e.g., "Under RA 10361 Sec. 24...")
- **Themes**: Use existing theme keys from `client/src/i18n/ui.json` under `chapter.theme.*`

## How to Improve Existing Scenarios

- Fix legal inaccuracies (cite the correct law)
- Add Tagalog translations for untranslated text
- Improve narrative quality while keeping reading level accessible
- Add `knowledgeGained` to choices that currently have `null`

## Submitting a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-change`
3. Make your changes
4. Test locally with `npm run dev`
5. Commit with a clear message describing what and why
6. Open a pull request against `main`

## Code of Conduct

This project exists to help vulnerable workers. Please be respectful of the communities this game serves. Contributions that trivialize labor exploitation or contain discriminatory content will not be accepted.
