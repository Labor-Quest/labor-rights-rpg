# Security

This document describes the security measures in place for Labor Rights RPG. Given that users may be Filipino workers in vulnerable employment situations, privacy and safety are paramount.

## 1. Developer & Deployment Security

### Secrets management
- `.gitignore` blocks `.env`, `.env.*`, `*.pem`, `*.key`, `*credentials*.json`, `*service-account*.json`, and `*secret*` patterns
- `.env.example` template shows required variables without values
- `ANTHROPIC_API_KEY` is only used in `scripts/generate.js` (offline content generation), never at runtime
- No API keys, tokens, or credentials exist anywhere in the committed codebase

### Docker container
- **Multi-stage build**: client build artifacts are copied from a disposable build stage; dev dependencies never reach the production image
- **Non-root user**: the container runs as `appuser`, not root
- **Minimal image**: `node:20-alpine` base, production deps only (`npm ci --omit=dev`)
- **No secrets baked in**: all configuration via environment variables at deploy time

### Deployment (deploy.sh)
- Project ID sourced from `$GCP_PROJECT_ID` env var, not hardcoded
- Cloud Run deployed with `--allow-unauthenticated` (intentional — public game)
- Memory/CPU/instance limits set to prevent runaway costs

### Dependencies
- **Server (0 vulnerabilities)**: express, cors, helmet, express-rate-limit
- **Client devDependencies (known)**: vite, esbuild, and workbox-build have moderate/high advisories that require breaking major version upgrades. These affect the **build toolchain only** — they do not ship in the production container or reach end users. Upgrade when Vite 8.x / vite-plugin-pwa 0.19.x stabilize.

## 2. User Privacy & Safety

### No tracking, no PII
- **Zero analytics**: no Google Analytics, no Mixpanel, no tracking pixels
- **No user accounts**: no login, no registration, no email collection
- **No server-side logging of user activity**: the server only logs its startup message
- **No cookies**: the application sets no cookies whatsoever

### Minimal localStorage
The app stores exactly two preferences in `localStorage`:
- `lrrpg-fontsize`: font size preference (`"small"`, `"medium"`, or `"large"`)
- `lrrpg-locale`: language preference (`"en"` or `"tl"`)

No game state, scores, choices, or personally identifiable information is persisted.

### Share feature
The share button (`EndScreen.jsx`) shares only:
- Grade letter (e.g., "A")
- Character name (a fictional game character, not the player)
- Site URL

No game choices, score numbers, or user-identifiable data is included.

### External links
All resource links (DOLE, NLRC, DMW, PAO, OWWA, NWPC) use HTTPS. Links open in new tabs with `rel="noopener noreferrer"` to prevent tab-napping.

### Referrer policy
`Referrer-Policy: no-referrer` — when users click external links to DOLE/NLRC, those sites cannot see that the user came from this game.

### No traceable footprint
A worker in a vulnerable situation (e.g., an OFW with a confiscated passport) can play the game and learn their rights without leaving evidence. No cookies, no accounts, no analytics, no server logs of their activity.

## 3. Application Security

### HTTP security headers (via Helmet)
| Header | Value | Purpose |
|---|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'` | Prevents XSS, clickjacking, unwanted resource loading |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` (production only) | Forces HTTPS |
| X-Content-Type-Options | `nosniff` | Prevents MIME-type sniffing |
| X-Frame-Options | `DENY` (via frame-ancestors) | Prevents embedding in iframes |
| Referrer-Policy | `no-referrer` | Protects user privacy on navigation |
| Cross-Origin-Opener-Policy | `same-origin` | Isolates browsing context |
| Cross-Origin-Resource-Policy | `same-origin` | Prevents cross-origin resource leaks |
| X-Powered-By | (removed) | Hides Express fingerprint |

### Path traversal prevention
The `/api/scenarios/:characterId` endpoint reads files from disk based on user input. Protections:
1. **Character ID whitelist**: only `ofw`, `rider`, `bpo`, `construction`, `driver`, `maid` are accepted. Any other value returns 400.
2. **Locale whitelist**: only `en` and `tl` are accepted. Any other value returns 400.
3. **Path containment check**: resolved file paths are verified to start with the `DATA_DIR` prefix before reading.

A request like `/api/scenarios/../../etc/passwd` is rejected at the whitelist before any file operation occurs.

### Rate limiting
- **300 requests per 15 minutes per IP** on all `/api/*` routes
- Standard `RateLimit-*` headers returned so clients can self-throttle
- Exceeded limit returns `429 Too Many Requests` with a JSON error

### CORS
- **Production**: only `labor-rights-rpg.web.app` and `labor-rights-rpg.firebaseapp.com`
- **Development**: `localhost:3000` and `localhost:8080`
- Methods restricted to `GET` only (this is a read-only API)

### Error handling
- **404 handler**: returns `{ error: "Not found" }`, no path disclosure
- **Global error handler**: returns `{ error: "Internal server error" }`, no stack traces in production
- **Static file serving**: `dotfiles: "deny"` prevents serving `.env`, `.git`, etc.

### Input validation
- `express.json({ limit: "1kb" })` — prevents large payload attacks (the API is read-only anyway)
- Query parameters and route params are validated against whitelists before use

### What this app does NOT have (by design)
- No database (no SQL injection surface)
- No user input stored server-side (no XSS persistence)
- No authentication (no credential theft surface)
- No file uploads (no upload-based attacks)
- No runtime AI calls (no prompt injection surface)
- No WebSocket connections (no hijacking surface)

## Adding New Characters

When adding a new character, add its ID to the `VALID_CHARACTERS` set in `server/src/routes/scenarios.js`. If you add a new locale, add it to `VALID_LOCALES`.

## Reporting Issues

If you find a security issue, please open a GitHub issue or contact the maintainer directly.
