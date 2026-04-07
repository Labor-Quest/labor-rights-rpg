# Labor Rights RPG

## What This Is
A text-based narrative RPG about OFW and gig worker labor rights in the Philippines. Players pick a character, face realistic workplace scenarios with RPG stat mechanics (money, confidence, wellbeing), and learn about their legal rights through gameplay — not lectures. Stats gate choices: workers can't assert rights they can't afford.

**Target audience**: Filipino workers, especially elderly/non-tech-savvy users on mobile phones. The developer's parents (family driver and kasambahay) are the primary testers.

**Business context**: Designed to be investable — targeting Anthropic, impact funds, DepEd/DICT. Solo developer project.

## Tech Stack
- **Frontend**: React 18 + Vite (client/)
- **Backend**: Express.js (server/)
- **Data**: Pre-generated static JSON — zero runtime AI costs
- **Deployment**: GCP Cloud Run + Firebase Hosting (live at https://laborquest.app)
- **Language**: JavaScript (no TypeScript)

## Project Structure
```
labor-rights-rpg/
├── client/                          # React frontend (Vite, port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── NarrativeRevealer.jsx # Paragraph-by-paragraph text reveal
│   │   │   └── StatDelta.jsx         # Floating +/- stat change animation
│   │   ├── context/
│   │   │   ├── FontSizeContext.jsx   # A-/A/A+ font size toggle, localStorage
│   │   │   ├── LanguageContext.jsx   # EN/TL language toggle, t() helper
│   │   │   └── GameSettingsContext.jsx # Quick Mode toggle, localStorage
│   │   ├── engine/
│   │   │   ├── GameEngine.js         # Core: state, scoring, stats, expenses, crises
│   │   │   ├── StatRules.js          # Theme-to-stat-weight mapping, stat derivation
│   │   │   ├── GatingRules.js        # Choice gating: lock choices based on stats
│   │   │   ├── CrisisEngine.js       # Monthly expenses, health crises, debt system, morale boosts
│   │   │   ├── EndingModifiers.js    # 27 stat-based ending epilogues (EN + TL), 14 hand-written
│   │   │   └── api.js                # Fetch wrapper, passes ?locale= param
│   │   ├── i18n/
│   │   │   └── ui.json               # UI string translations (en + tl, ~70 keys)
│   │   ├── screens/
│   │   │   ├── TitleScreen.jsx       # Landing page
│   │   │   ├── CharacterSelect.jsx   # Grouped by category, collapsible sections
│   │   │   ├── GameScreen.jsx        # Narrative reveal + gated choices + stat HUD + chapter markers
│   │   │   └── EndScreen.jsx         # Stats + epilogue + story summary + knowledge + resources
│   │   ├── styles/global.css         # Dark theme, animations, RPG UI styles
│   │   ├── App.jsx                   # Screen router, wraps 3 context providers
│   │   └── main.jsx                  # Entry point
│   ├── public/
│   │   ├── manifest.json             # PWA manifest (standalone, theme #f0c040)
│   │   └── icons/
│   │       ├── icon-192.png          # App icon 192x192
│   │       └── icon-512.png          # App icon 512x512
│   ├── vite.config.js                # Proxies /api to :8080, vite-plugin-pwa config
│   └── index.html                    # OG meta tags, Google Fonts, manifest
├── server/                           # Express API (port 8080)
│   └── src/
│       ├── index.js                  # Server: helmet, rate limiting, CORS, error handler
│       └── routes/scenarios.js       # Whitelisted character IDs + locales
├── data/scenarios/                   # Pre-generated content (committed to git)
│   ├── characters.json               # 6 characters with category field
│   ├── characters.tl.json            # Tagalog character descriptions
│   ├── resources.json                # DOLE, NLRC, DMW, PAO, OWWA contacts
│   ├── {ofw,rider,bpo,construction,driver,maid}.json       # English scenarios
│   └── {ofw,rider,bpo,construction,driver,maid}.tl.json    # Tagalog scenarios
├── Dockerfile                        # Multi-stage Cloud Run container (non-root)
├── firebase.json                     # Firebase Hosting → Cloud Run proxy
├── deploy.sh                         # One-command GCP deployment
├── .env.example                      # Env var template
├── SECURITY.md                       # Security documentation
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

| ID | Name | Role | Category | Nodes | Starting ₱ | Key Laws |
|---|---|---|---|---|---|---|
| ofw | Maria Santos | OFW (domestic helper) | overseas | 33 | ₱8,000 | RA 10022, RA 8042 |
| rider | Jake Reyes | Delivery rider | gig | 31 | ₱3,000 | Labor Code Art. 295, DO 174 |
| bpo | Angela Cruz | Call center agent | office | 35 | ₱12,000 | Art. 86-87, RA 11036 |
| construction | Roberto Dela Cruz | Construction worker | industrial | 36 | ₱5,000 | RA 11058, Art. 106-109 |
| driver | Mang Ernesto Bautista | Family driver | domestic | 36 | ₱7,000 | Art. 82-96, PD 851, Art. 295 |
| maid | Aling Rosa Mendoza | Kasambahay | domestic | 35 | ₱1,500 | RA 10361 (Batas Kasambahay) |

## RPG Mechanics (layered on top of existing JSON — no data changes)

### Three Stats
- **Pera (Money)**: Philippine pesos. Drains every 5 nodes via monthly expenses. Goes negative = UTANG (debt) with 20% interest. Gates legal action choices.
- **Lakas ng Loob (Confidence)**: 0-100. Required to "assert your rights" choices. Below 25: doubt text appears on bold choices.
- **Kalusugan (Wellbeing)**: 0-100. Low values trigger random health crisis events (cost money, lose stats). Below 30: "refuse unsafe work" locked.

### Stat Derivation
Stats are derived from existing `scoreChange` + `theme` fields via `StatRules.js`. Each theme has weights (e.g., `wage_theft`: 70% pera, 20% confidence, 10% wellbeing). Losses amplified ×300 vs gains ×150. No JSON changes needed.

### Choice Gating
- Only high-score choices (scoreChange ≥ 8) get gated based on stat thresholds
- Low-score "give in" choices are NEVER locked — exploitation is always accessible
- If ALL choices would be gated, the lowest-score one is force-unlocked
- Locked choices are visible but disabled, showing requirements

### Economic Pressure Loop
- Every 5 nodes: mandatory expense event (per-character, e.g., "Installment ng Honda TMX: ₱4,800")
- Debt locks ALL money-requiring choices (filing complaints, lawyers, transport)
- Health crises: wellbeing < 40 → random illness events that cost money
- **Morale boosts**: confidence or wellbeing > 55 → 15% chance of positive event per node (e.g., "A coworker thanks you for speaking up"). Character-specific pools (social + financial). Symmetric to crisis system architecture.
- This creates the real tension: "I know my rights but can't afford to use them"

### Chapter System
- Theme changes between nodes trigger a **chapter transition card** ("Kabanata 3: Wage Theft") with theme icon
- Chapter numbering counts distinct consecutive theme transitions
- All 20 themes have EN + TL translations in `ui.json` under `chapter.theme.*` keys

### Endings
- 27 ending modifiers (3×3×3: financial × agency × health)
- 14 hand-written epilogues for key combinations (EN + TL), fallback composition for the rest
- Epilogue paragraph contextualizes the ending based on final stats

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

## Adding a New Character
1. Add entry to `data/scenarios/characters.json` (and `characters.tl.json`) with: id, name, role, description, avatar, themes, startNode, category
2. Create `data/scenarios/{id}.json` with 30+ nodes following the structure above
3. Create `data/scenarios/{id}.tl.json` (Tagalog translation, same structure/IDs)
4. Add icon to `ROLE_ICONS` in `client/src/screens/CharacterSelect.jsx`
5. **Add the character ID to `VALID_CHARACTERS` in `server/src/routes/scenarios.js`** (security whitelist)
6. **Add starting money to `CHARACTER_STARTING_STATS` in `client/src/engine/StatRules.js`**
7. **Add expense events to `EXPENSE_EVENTS` and boost events to `BOOST_POOLS` in `client/src/engine/CrisisEngine.js`**
8. Existing categories: overseas, gig, office, industrial, domestic. Add new ones in `CATEGORIES` array in CharacterSelect.jsx and `ui.json` translations.

## i18n System
- Lightweight, no library — just React context + JSON file
- UI strings: `client/src/i18n/ui.json` (keys under "en" and "tl", ~110 keys)
- Use `const { t } = useLanguage()` then `t("key.name")` in components
- Scenario files: `{id}.json` (English) / `{id}.tl.json` (Tagalog)
- Server route tries locale-specific file first, falls back to default
- Default locale is "tl" (Tagalog) since primary audience is Filipino

## Accessibility Features
- **Progressive text reveal**: Narrative shown one paragraph at a time with "Susunod" button
- **Quick Mode**: Lightning bolt toggle — shows first paragraph only, choices appear immediately
- Font size toggle: small (16px) / medium (19px) / large (22px), +1px on mobile
- Auto-splits paragraphs >120 words at sentence boundaries
- Min touch targets: 48px for choice buttons, 44px for regular buttons
- 3 responsive breakpoints: 480px, 768px, 1024px

## Animations (all CSS, no libraries)
- `fadeInParagraph`: progressive text reveal (0.5s)
- `slideInLeft`: consequence panel
- `knowledgePop`: "BAGONG KAALAMAN!" celebration (scale bounce)
- `floatUp`: stat change deltas (+₱2,500 / -5 confidence)
- `subtlePulse`: continue button glow
- `fadeOut` / `fadeIn`: scene transitions (300ms)
- Choice selection: gold highlight + others dim to 30%
- `navigator.vibrate(100)` on knowledge unlock (mobile)

## PWA / Offline Support
- **vite-plugin-pwa** with Workbox `generateSW` mode, `registerType: "autoUpdate"`
- Precaches all static assets on first visit
- Runtime caching: `NetworkFirst` for `/api/` (3s timeout), `CacheFirst` for fonts
- Manifest: standalone display, theme `#f0c040`, background `#0a0a0f`

## Security
- **Helmet.js**: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- **Rate limiting**: 300 req/15min per IP on `/api/*`
- **CORS**: Restricted to Firebase domains in prod, GET-only
- **Path traversal prevention**: Character IDs and locales whitelisted
- **Docker**: Multi-stage build, non-root user, production deps only
- **Privacy**: Zero analytics, zero cookies, zero PII

## Deployment
- **Firebase Hosting** serves static files → free CDN
- **Cloud Run** handles only `/api/*`, proxied via Firebase rewrites
- **Artifact Registry** (`asia-southeast1`) stores Docker images
- **Scale-to-zero**: `min-instances: 0`, `cpu-throttling`, `max-instances: 1`
- **Cost**: $0/month at low traffic
- **Deploy command**: `bash deploy.sh --skip-setup`

## What's NOT Done Yet
- **Trap choices**: 2-3 per character that sound right but backfire (addresses "choices too obvious" feedback)
- **DOLE realism**: Institutional failure nodes + expanded resources (addresses "DOLE walang silbe" feedback)
- **Shareable score card**: Canvas-generated share image + challenge URL for competitive replay
- **Union organizer character**: New character focused on right to organize (Art. 253), based on real playtester experience
- **More characters**: Could add fisher folk, jeepney driver, vendor, farm worker, HR antagonist
- **Billing budget alert**: Create at GCP Console ($5/month)
- **Analytics**: No tracking yet (intentionally — privacy first)

## Design Principles
- **Zero runtime AI costs**: All 412 scenario nodes are pre-generated static JSON
- **Stats must affect gameplay**: Every stat gates choices, triggers events, or changes outcomes
- **The mechanic IS the lesson**: Economic pressure creates the same dilemmas real workers face
- **Elderly-first design**: Progressive reveal, large fonts, high contrast, big touch targets
- **Three perspectives**: Every feature must work for gamers (fun), learners (educational), and the mission (labor rights awareness)
