const express = require("express");
const cors = require("cors");
const path = require("path");
const { getState, setState } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SYNC_KEY = process.env.STUDY_TRACKER_SYNC_KEY || "";

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

function authorized(req) {
  if (!SYNC_KEY) return true;
  return req.get("x-sync-key") === SYNC_KEY;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "Study Tracker", version: "2.0.0", syncProtected: Boolean(SYNC_KEY), timestamp: new Date().toISOString() });
});

app.get("/api/state", (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized" });
  res.json({ ok: true, state: getState() });
});

app.put("/api/state", (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized" });
  const state = req.body?.state;
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return res.status(400).json({ error: "A state object is required" });
  }
  const meta = setState(state);
  res.json({ ok: true, ...meta });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Study Tracker running on http://localhost:${PORT}`);
});