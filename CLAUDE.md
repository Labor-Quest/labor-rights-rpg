# Labor Rights RPG

## What This Is
A text-based narrative branching RPG about OFW and gig worker labor rights in the Philippines. Players pick a character, face realistic workplace scenarios, make choices that teach them about their legal rights, and see real legal resources at the end.

**Target audience**: Filipino workers, especially elderly/non-tech-savvy users on mobile phones. The developer's parents (family driver and kasambahay) are the primary testers.

**Business context**: Designed to be investable — targeting Anthropic, impact funds, DepEd/DICT. Solo developer project.

## Tech Stack
- **Frontend**: React 18 + Vite (client/)
- **Backend**: Express.js (server/)
- **Data**: Pre-generated static JSON — zero runtime AI costs
- **Deployment**: GCP Cloud Run + Firebase Hosting (not yet deployed)
- **Language**: JavaScript (no TypeScript)

## Project Structure
```
labor-rights-rpg/
├── client/                          # React frontend (Vite, port 3000)
│   ├── src/
│   │   ├── context/
│   │   │   ├── FontSizeContext.jsx   # A-/A/A+ font size toggle, localStorage
│   │   │   └── LanguageContext.jsx   # EN/TL language toggle, t() helper
│   │   ├── engine/
│   │   │   ├── GameEngine.js         # Pure game logic: state, scoring, choices
│   │   │   └── api.js                # Fetch wrapper, passes ?locale= param
│   │   ├── i18n/
│   │   │   └── ui.json               # UI string translations (en + tl, ~40 keys)
│   │   ├── screens/
│   │   │   ├── TitleScreen.jsx       # Landing page
│   │   │   ├── CharacterSelect.jsx   # Grouped by category, collapsible sections
│   │   │   ├── GameScreen.jsx        # Narrative + choices + score bar
│   │   │   └── EndScreen.jsx         # Score + knowledge + resources + share btn
│   │   ├── styles/global.css         # Dark theme, 3 breakpoints (480/768/1024)
│   │   ├── App.jsx                   # Screen router, wraps FontSize + Language providers
│   │   └── main.jsx                  # Entry point
│   ├── public/
│   │   ├── manifest.json             # PWA manifest (standalone, theme #f0c040)
│   │   └── icons/
│   │       ├── icon-192.png          # App icon 192x192 (gold bg + "LR" text)
│   │       └── icon-512.png          # App icon 512x512
│   ├── vite.config.js                # Proxies /api to :8080, vite-plugin-pwa config
│   └── index.html                    # OG meta tags, Google Fonts, manifest + apple-touch-icon
├── server/                           # Express API (port 8080)
│   └── src/
│       ├── index.js                  # Server entry, serves React build in prod
│       └── routes/scenarios.js       # /api/characters, /api/scenarios/:id, /api/resources
│                                     # Supports ?locale=tl (tries {id}.tl.json first)
├── data/scenarios/                   # Pre-generated content (committed to git)
│   ├── characters.json               # 6 characters with category field
│   ├── characters.tl.json            # Tagalog character descriptions
│   ├── resources.json                # DOLE, NLRC, DMW, PAO, OWWA contacts
│   ├── {ofw,rider,bpo,construction,driver,maid}.json       # English scenarios
│   └── {ofw,rider,bpo,construction,driver,maid}.tl.json    # Tagalog scenarios
├── scripts/
│   ├── generate.js                   # Claude API content generator (optional, not needed)
│   └── package.json                  # @anthropic-ai/sdk dependency
├── Dockerfile                        # Cloud Run container
├── firebase.json                     # Firebase Hosting → Cloud Run proxy
├── deploy.sh                         # One-command GCP deployment
└── package.json                      # Root: concurrently runs server + client
```

## Commands
```bash
npm run dev          # Start both server (:8080) and client (:3000)
npm run dev:server   # Server only
npm run dev:client   # Client only
npm run build        # Build React for production (client/dist)
npm start            # Production server (serves built client + API)
```

## Characters (6 total, 206 nodes EN + 206 nodes TL = 412 total)

| ID | Name | Role | Category | Nodes | Key Laws |
|---|---|---|---|---|---|
| ofw | Maria Santos | OFW (domestic helper) | overseas | 33 | RA 10022, RA 8042 |
| rider | Jake Reyes | Delivery rider | gig | 31 | Labor Code Art. 295, DO 174 |
| bpo | Angela Cruz | Call center agent | office | 35 | Art. 86-87, RA 11036 |
| construction | Roberto Dela Cruz | Construction worker | industrial | 36 | RA 11058, Art. 106-109 |
| driver | Mang Ernesto Bautista | Family driver | domestic | 36 | Art. 82-96, PD 851, Art. 295 |
| maid | Aling Rosa Mendoza | Kasambahay | domestic | 35 | RA 10361 (Batas Kasambahay) |

## Scenario JSON Structure
Each character has a `.json` (English) and `.tl.json` (Tagalog) file:
```json
{
  "nodes": {
    "node_id": {
      "id": "node_id",
      "title": "Scene title",
      "narrative": "2-4 paragraphs of story text",
      "theme": "wage_theft | no_contract | unsafe_conditions | ...",
      "choices": [
        {
          "text": "What the player does",
          "nextNode": "next_node_id",
          "consequence": "What happens",
          "scoreChange": -10 to +15,
          "knowledgeGained": "Legal fact learned (or null)"
        }
      ],
      "isEnding": false
    }
  },
  "startNode": "character_start"
}
```
Ending nodes have `"isEnding": true` and empty/no choices.

## Adding a New Character
1. Add entry to `data/scenarios/characters.json` (and `characters.tl.json`) with: id, name, role, description, avatar, themes, startNode, category
2. Create `data/scenarios/{id}.json` with 30+ nodes following the structure above
3. Create `data/scenarios/{id}.tl.json` (Tagalog translation, same structure/IDs)
4. Add icon to `ROLE_ICONS` in `client/src/screens/CharacterSelect.jsx`
5. Existing categories: overseas, gig, office, industrial, domestic. Add new ones in `CATEGORIES` array in CharacterSelect.jsx and `ui.json` translations.

## i18n System
- Lightweight, no library — just React context + JSON file
- UI strings: `client/src/i18n/ui.json` (keys under "en" and "tl")
- Use `const { t } = useLanguage()` then `t("key.name")` in components
- Scenario files: `{id}.json` (English) / `{id}.tl.json` (Tagalog)
- Server route tries locale-specific file first, falls back to default
- Default locale is "tl" (Tagalog) since primary audience is Filipino

## Accessibility Features
- Font size toggle: small (16px) / medium (19px) / large (22px), +1px on mobile
- Auto-splits paragraphs >120 words at sentence boundaries (display only)
- Line-height 2.0 for narrative text
- Min touch targets: 48px for choice buttons, 44px for regular buttons
- 3 responsive breakpoints: 480px, 768px, 1024px

## PWA / Offline Support
- **vite-plugin-pwa** with Workbox `generateSW` mode, `registerType: "autoUpdate"`
- Precaches all static assets (JS, CSS, HTML, images) on first visit
- Runtime caching: `NetworkFirst` for `/api/` (3s timeout), `StaleWhileRevalidate` for Google Fonts CSS, `CacheFirst` for font files
- Manifest: standalone display, theme `#f0c040`, background `#0a0a0f`
- Icons: simple gold background with dark "LR" text (192px + 512px)
- Build outputs: `sw.js`, `registerSW.js` (auto-injected into index.html)

## What's NOT Done Yet
- **GCP deployment**: Dockerfile and configs exist but not deployed yet
- **Analytics**: No tracking of play sessions, scores, or dropout points
- **More characters**: Could add fisher folk, jeepney driver, vendor, farm worker

## Design Decisions
- **Zero runtime AI costs**: All 412 scenario nodes are pre-generated static JSON, committed to git
- **No art assets**: Typography-driven dark theme (IBM Plex Sans/Mono)
- **Tagalog default**: Primary audience speaks Filipino, English is secondary
- **Categories over flat list**: Characters grouped by worker type for scalability
- **Elderly-first design**: Large fonts, high contrast, big touch targets, short paragraphs
