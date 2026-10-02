const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "study-tracker.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  profile_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_state (
  user_id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`);

const cryptoAsync = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => {
      if (err) reject(err);
      else resolve(derived.toString("hex"));
    });
  });

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(row) {
  const profile = JSON.parse(row.profile_json || "{}");
  return {
    id: row.id,
    username: row.username,
    profile
  };
}

function createInitialState(profile = {}) {
  return {
    theme: "dark",
    view: "dashboard",
    profile: {
      name: profile.name || "",
      institution: profile.institution || "",
      city: profile.city || "",
      program: profile.program || "",
      avatar: profile.avatar || ""
    },
    preferences: {
      notifications: true,
      reminderMinutes: 15,
      weekStartsOn: "Monday"
    },
    goals: {
      weeklyMinutes: 300,
      semesterTargetMinutes: 7200
    },
    activeSemesterId: "",
    semesters: [],
    units: [],
    lessons: [],
    tasks: [],
    attendance: [],
    sessions: [],
    events: [],
    grades: [],
    notes: [],
    resources: []
  };
}

async function createUser({ username, password, profile }) {
  const cleanUsername = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
    const e = new Error("Username must be 3–30 characters using letters, numbers, dots, underscores or hyphens.");
    e.code = "INVALID_USERNAME";
    throw e;
  }
  if (String(password || "").length < 8) {
    const e = new Error("Password must be at least 8 characters.");
    e.code = "INVALID_PASSWORD";
    throw e;
  }
  const exists = db.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE").get(cleanUsername);
  if (exists) {
    const e = new Error("Username is already registered.");
    e.code = "USERNAME_EXISTS";
    throw e;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = await cryptoAsync(password, salt);
  const profileJson = JSON.stringify({
    name: String(profile?.name || "").trim().slice(0, 80),
    institution: String(profile?.institution || "").trim().slice(0, 120),
    city: String(profile?.city || "").trim().slice(0, 80),
    program: String(profile?.program || "").trim().slice(0, 100),
    avatar: String(profile?.avatar || "").slice(0, 250000)
  });
  const info = db.prepare("INSERT INTO users(username,password_hash,password_salt,created_at,profile_json) VALUES(?,?,?,?,?)")
    .run(cleanUsername, passwordHash, salt, new Date().toISOString(), profileJson);

  const state = createInitialState(JSON.parse(profileJson));
  saveState(info.lastInsertRowid, state);
  return getUserById(info.lastInsertRowid);
}

function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(String(username || "").trim());
}
function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

async function verifyPassword(password, salt, expectedHex) {
  const actual = Buffer.from(await cryptoAsync(password, salt), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function authenticate(username, password) {
  const user = getUserByUsername(username);
  if (!user) return null;
  const ok = await verifyPassword(String(password || ""), user.password_salt, user.password_hash);
  return ok ? user : null;
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  db.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .run(tokenHash, userId, now.toISOString(), expires.toISOString());
  return { token, expiresAt: expires.toISOString() };
}

function getUserFromSession(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(hashToken(token), new Date().toISOString());
  return row || null;
}

function deleteSession(token) {
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

function cleanupSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

function getState(userId) {
  const row = db.prepare("SELECT payload FROM user_state WHERE user_id = ?").get(userId);
  if (!row) {
    const user = getUserById(userId);
    const state = createInitialState(JSON.parse(user?.profile_json || "{}"));
    saveState(userId, state);
    return state;
  }
  try {
    return JSON.parse(row.payload);
  } catch {
    const state = createInitialState();
    saveState(userId, state);
    return state;
  }
}

function saveState(userId, state) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO user_state(user_id,payload,updated_at)
    VALUES(?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
  `).run(userId, JSON.stringify(state), now);
  if (state?.profile) {
    db.prepare("UPDATE users SET profile_json = ? WHERE id = ?")
      .run(JSON.stringify({
        name: String(state.profile.name || "").slice(0, 80),
        institution: String(state.profile.institution || "").slice(0, 120),
        city: String(state.profile.city || "").slice(0, 80),
        program: String(state.profile.program || "").slice(0, 100),
        avatar: String(state.profile.avatar || "").slice(0, 250000)
      }), userId);
  }
  return { updatedAt: now };
}

module.exports = {
  db,
  createUser,
  authenticate,
  createSession,
  getUserFromSession,
  deleteSession,
  cleanupSessions,
  getState,
  saveState,
  getUserById,
  publicUser
};
