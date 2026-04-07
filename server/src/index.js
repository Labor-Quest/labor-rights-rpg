const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const scenarioRoutes = require("./routes/scenarios");

const app = express();
const PORT = process.env.PORT || 8080;
const isProd = process.env.NODE_ENV === "production";

// --- Security headers via Helmet ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  // HSTS — only in production behind HTTPS
  strictTransportSecurity: isProd
    ? { maxAge: 63072000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: "no-referrer" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

// --- CORS ---
const ALLOWED_ORIGINS = isProd
  ? [
      "https://labor-rights-rpg.web.app",
      "https://labor-rights-rpg.firebaseapp.com"
    ]
  : ["http://localhost:3000", "http://localhost:8080"];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ["GET"],
  credentials: false
}));

// --- Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" }
});
app.use("/api", apiLimiter);

// --- Body parsing (limited size) ---
app.use(express.json({ limit: "1kb" }));

// --- Disable x-powered-by (helmet does this, but be explicit) ---
app.disable("x-powered-by");

// --- API routes ---
app.use("/api", scenarioRoutes);

// --- Serve React build in production ---
if (isProd) {
  const staticDir = path.join(__dirname, "../../client/dist");
  app.use(express.static(staticDir, {
    dotfiles: "deny",         // Block .env, .git, etc.
    index: ["index.html"]
  }));
  // SPA fallback — only serve index.html for non-API, non-file routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- Global error handler — no stack traces leaked ---
app.use((err, req, res, _next) => {
  if (!isProd) {
    console.error(err.stack);
  }
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Labor Rights RPG server running on port ${PORT}`);
});
