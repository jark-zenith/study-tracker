const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "data");
const filePath = path.join(dataDir, "study-tracker.json");
fs.mkdirSync(dataDir, { recursive: true });

const emptyDb = { users: [], states: {}, sessions: {} };
let db = loadDb();

function loadDb() {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      users: Array.isArray(value.users) ? value.users : [],
      states: value.states && typeof value.states === "object" ? value.states : {},
      sessions: value.sessions && typeof value.sessions === "object" ? value.sessions : {}
    };
  } catch {
    return structuredClone(emptyDb);
  }
}

function persist() {
  const temp = filePath + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(temp, filePath);
}

function publicUser(user) {
  return { id: user.id, username: user.username, profile: user.profile || {} };
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
    preferences: { notifications: true, reminderMinutes: 15, weekStartsOn: "Monday", syncEnabled: true },
    goals: { weeklyMinutes: 300, semesterTargetMinutes: 7200 },
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

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function passwordHash(password, salt) {
  return crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
}

function createUser({ username, password, profile }) {
  const clean = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(clean)) {
    const error = new Error("Username must be 3–30 characters using letters, numbers, dots, underscores or hyphens.");
    error.code = "INVALID_USERNAME";
    throw error;
  }
  if (String(password || "").length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.code = "INVALID_PASSWORD";
    throw error;
  }
  if (db.users.some(u => u.username === clean)) {
    const error = new Error("Username is already registered.");
    error.code = "USERNAME_EXISTS";
    throw error;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const user = {
    id: crypto.randomUUID(),
    username: clean,
    passwordHash: passwordHash(password, salt),
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    profile: {
      name: String(profile?.name || "").trim().slice(0, 80),
      institution: String(profile?.institution || "").trim().slice(0, 120),
      city: String(profile?.city || "").trim().slice(0, 80),
      program: String(profile?.program || "").trim().slice(0, 100),
      avatar: String(profile?.avatar || "").slice(0, 250000)
    }
  };

  db.users.push(user);
  db.states[user.id] = createInitialState(user.profile);
  persist();
  return user;
}

function getUserByUsername(username) {
  const clean = String(username || "").trim().toLowerCase();
  return db.users.find(u => u.username === clean) || null;
}

function authenticate(username, password) {
  const user = getUserByUsername(username);
  if (!user) return null;
  const hash = passwordHash(password, user.passwordSalt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(user.passwordHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? user : null;
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions[tokenHash] = { userId, createdAt: new Date(now).toISOString(), expiresAt };
  persist();
  return { token, expiresAt };
}

function getUserFromSession(token) {
  if (!token) return null;
  const key = hashToken(token);
  const session = db.sessions[key];
  if (!session) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    delete db.sessions[key];
    persist();
    return null;
  }
  return db.users.find(u => u.id === session.userId) || null;
}

function deleteSession(token) {
  if (!token) return;
  delete db.sessions[hashToken(token)];
  persist();
}

function cleanupSessions() {
  const now = Date.now();
  let changed = false;
  for (const [key, session] of Object.entries(db.sessions)) {
    if (Date.parse(session.expiresAt) <= now) {
      delete db.sessions[key];
      changed = true;
    }
  }
  if (changed) persist();
}

function getState(userId) {
  if (!db.states[userId]) {
    const user = db.users.find(u => u.id === userId);
    db.states[userId] = createInitialState(user?.profile);
    persist();
  }
  return db.states[userId];
}

function saveState(userId, state) {
  db.states[userId] = state;
  const user = db.users.find(u => u.id === userId);
  if (user && state.profile) {
    user.profile = {
      name: String(state.profile.name || "").slice(0, 80),
      institution: String(state.profile.institution || "").slice(0, 120),
      city: String(state.profile.city || "").slice(0, 80),
      program: String(state.profile.program || "").slice(0, 100),
      avatar: String(state.profile.avatar || "").slice(0, 250000)
    };
  }
  persist();
  return { updatedAt: new Date().toISOString() };
}

module.exports = {
  createUser,
  authenticate,
  createSession,
  getUserFromSession,
  deleteSession,
  cleanupSessions,
  getState,
  saveState,
  getUserById: id => db.users.find(u => u.id === id) || null,
  publicUser
};
