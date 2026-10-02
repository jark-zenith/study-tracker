const express = require("express");
const path = require("path");
const {
  createUser,
  authenticate,
  createSession,
  getUserFromSession,
  deleteSession,
  cleanupSessions,
  getState,
  saveState,
  publicUser
} = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function cookieToken(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(/(?:^|;\s*)study_tracker_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
function setSessionCookie(res, token, expiresAt) {
  const parts = [
    "study_tracker_session=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + Math.floor((new Date(expiresAt) - Date.now()) / 1000)
  ];
  if (isProduction) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
function clearSessionCookie(res) {
  const parts = ["study_tracker_session=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isProduction) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
function authUser(req, res, next) {
  const user = getUserFromSession(cookieToken(req));
  if (!user) return res.status(401).json({ error: "Please sign in." });
  req.user = user;
  next();
}

cleanupSessions();
setInterval(cleanupSessions, 60 * 60 * 1000).unref();

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "Study Tracker",
    version: "3.0.0",
    authentication: true,
    multiUser: true,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, profile = {} } = req.body || {};
    const user = await createUser({ username, password, profile });
    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    res.status(201).json({ ok: true, user: publicUser(user), expiresAt: session.expiresAt });
  } catch (error) {
    const code = error.code || "REGISTER_FAILED";
    const status = code === "USERNAME_EXISTS" ? 409 : code.startsWith("INVALID_") ? 400 : 500;
    res.status(status).json({ error: error.message || "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await authenticate(username, password);
    if (!user) return res.status(401).json({ error: "Invalid username or password." });
    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    res.json({ ok: true, user: publicUser(user), expiresAt: session.expiresAt });
  } catch {
    res.status(500).json({ error: "Login failed." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  deleteSession(cookieToken(req));
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", authUser, (req, res) => {
  res.json({ ok: true, user: publicUser(req.user) });
});

app.get("/api/state", authUser, (req, res) => {
  res.json({ ok: true, state: getState(req.user.id) });
});

app.put("/api/state", authUser, (req, res) => {
  const state = req.body?.state;
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return res.status(400).json({ error: "A state object is required." });
  }
  // Keep profile fields bounded; the client also resizes avatar images.
  if (state.profile?.avatar && String(state.profile.avatar).length > 250000) {
    return res.status(413).json({ error: "Profile image is too large." });
  }
  const meta = saveState(req.user.id, state);
  res.json({ ok: true, ...meta });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log("Study Tracker running on port " + PORT));
