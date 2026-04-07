const express = require("express");
const cors = require("cors");
const path = require("path");
const scenarioRoutes = require("./routes/scenarios");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve pre-generated scenario data
app.use("/api", scenarioRoutes);

// In production, serve the React build
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Labor Rights RPG server running on port ${PORT}`);
});
