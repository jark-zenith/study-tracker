const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "study-tracker.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

const defaultState = {
  theme: "dark",
  view: "dashboard",
  activeSemesterId: "sem3-2026",
  profile: { name: "Student", institution: "Vision Empowerment Training Institute", city: "Kitengela, Kenya", program: "ICT" },
  preferences: { notifications: true, reminderMinutes: 15, weekStartsOn: "Monday" },
  goals: { weeklyMinutes: 300, semesterTargetMinutes: 7200 },
  semesters: [
    { id: "sem3-2026", name: "Semester 3", year: "2026", start: "2026-10-01", end: "2026-12-31", status: "active" },
    { id: "sem1-2026", name: "Semester 1", year: "2026", start: "2026-01-01", end: "2026-04-30", status: "completed" },
    { id: "sem2-2026", name: "Semester 2", year: "2026", start: "2026-05-01", end: "2026-09-30", status: "completed" }
  ],
  units: [
    { id: "u-os", semesterId: "sem3-2026", name: "Operating System", code: "", lecturer: "", room: "L24", credits: 0, targetMinutes: 1800 },
    { id: "u-ca2", semesterId: "sem3-2026", name: "Computer Application II", code: "", lecturer: "", room: "L21", credits: 0, targetMinutes: 1800 },
    { id: "u-sp", semesterId: "sem3-2026", name: "Structured Programming", code: "", lecturer: "", room: "L20", credits: 0, targetMinutes: 1800 }
  ],
  lessons: [
    { id: "l1", semesterId: "sem3-2026", unitId: "u-os", day: "Tuesday", start: "08:00", end: "10:00", room: "L24", reminder: 15 },
    { id: "l2", semesterId: "sem3-2026", unitId: "u-os", day: "Wednesday", start: "08:00", end: "10:00", room: "L23", reminder: 15 },
    { id: "l3", semesterId: "sem3-2026", unitId: "u-os", day: "Friday", start: "08:00", end: "10:00", room: "L21", reminder: 15 },
    { id: "l4", semesterId: "sem3-2026", unitId: "u-ca2", day: "Monday", start: "10:15", end: "12:00", room: "L21", reminder: 15 },
    { id: "l5", semesterId: "sem3-2026", unitId: "u-ca2", day: "Tuesday", start: "10:15", end: "12:00", room: "L22", reminder: 15 },
    { id: "l6", semesterId: "sem3-2026", unitId: "u-ca2", day: "Thursday", start: "15:15", end: "17:00", room: "L15", reminder: 15 },
    { id: "l7", semesterId: "sem3-2026", unitId: "u-sp", day: "Tuesday", start: "15:15", end: "17:00", room: "L20", reminder: 15 },
    { id: "l8", semesterId: "sem3-2026", unitId: "u-sp", day: "Thursday", start: "10:15", end: "12:00", room: "L22", reminder: 15 }
  ],
  tasks: [],
  attendance: [],
  sessions: [],
  events: [],
  grades: [],
  notes: [],
  resources: []
};

function getState() {
  const row = db.prepare("SELECT payload FROM app_state WHERE id = 1").get();
  if (!row) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?)").run(JSON.stringify(defaultState), now);
    return structuredClone(defaultState);
  }
  try { return JSON.parse(row.payload); } catch { return structuredClone(defaultState); }
}

function setState(state) {
  const now = new Date().toISOString();
  db.prepare("INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
    .run(JSON.stringify(state), now);
  return { updatedAt: now };
}

module.exports = { db, getState, setState };