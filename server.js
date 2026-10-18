const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite"); // built into Node 22+, no install needed

try { process.loadEnvFile(); } catch { /* walang .env file, okay lang */ }

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "school.db");
const SEED_DEMO = process.env.SEED_DEMO !== "false"; // sa production: SEED_DEMO=false

const app = express();
const db = new DatabaseSync(DB_PATH);

if (IS_PROD) app.set("trust proxy", 1); // para tama ang IP sa likod ng hosting proxy

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// DATABASE TABLES
// =====================================================
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    initials TEXT NOT NULL,
    program TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL, professor TEXT NOT NULL, badge TEXT NOT NULL, color TEXT NOT NULL,
    progress INTEGER NOT NULL, credits INTEGER NOT NULL, weeks INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    day_order INTEGER NOT NULL, day TEXT NOT NULL,
    name TEXT NOT NULL, room TEXT NOT NULL, time TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL, level TEXT NOT NULL, badge TEXT NOT NULL,
    deadline TEXT NOT NULL, details TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    gwa REAL, gwa_change REAL,
    courses_done INTEGER, courses_total INTEGER, courses_change INTEGER,
    assignments INTEGER, assignments_due INTEGER,
    study_hours INTEGER, study_change INTEGER,
    gpa REAL, gpa_change REAL,
    progress INTEGER, progress_change INTEGER,
    avg_score INTEGER, avg_change INTEGER,
    streak INTEGER
  );
  CREATE TABLE IF NOT EXISTS study_week (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    day TEXT NOT NULL, pct INTEGER NOT NULL
  );
`);

// Migration: dagdag na "score" column sa courses (para sa lumang school.db)
if (!db.prepare("PRAGMA table_info(courses)").all().some((c) => c.name === "score")) {
  db.exec("ALTER TABLE courses ADD COLUMN score INTEGER");
  db.exec("UPDATE courses SET score = progress");
}

// =====================================================
// PASSWORD HASHING (built-in crypto, no bcrypt install)
// =====================================================
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function checkPassword(password, user) {
  const a = Buffer.from(hashPassword(password, user.salt), "hex");
  const b = Buffer.from(user.password_hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// =====================================================
// SAMPLE STUDENTS (nilalagay lang kapag walang laman ang database)
// =====================================================
function seedStudent(s) {
  const salt = crypto.randomBytes(16).toString("hex");
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (username, password_hash, salt, full_name, initials, program) VALUES (?,?,?,?,?,?)")
    .run(s.username, hashPassword(s.password, salt), salt, s.fullName, s.initials, s.program);
  const uid = Number(lastInsertRowid);

  for (const c of s.courses)
    db.prepare("INSERT INTO courses (user_id,name,professor,badge,color,progress,credits,weeks,score) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(uid, c.name, c.professor, c.badge, c.color, c.progress, c.credits, 16, c.progress);

  s.schedule.forEach(([day, name, room, time]) =>
    db.prepare("INSERT INTO schedule (user_id,day_order,day,name,room,time) VALUES (?,?,?,?,?,?)")
      .run(uid, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].indexOf(day), day, name, room, time));

  for (const a of s.assessments)
    db.prepare("INSERT INTO assessments (user_id,title,level,badge,deadline,details) VALUES (?,?,?,?,?,?)")
      .run(uid, a.title, a.level, a.badge, a.deadline, JSON.stringify(a.details));

  const t = s.stats;
  db.prepare("INSERT INTO stats VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(uid, t.gwa, t.gwaChange, t.coursesDone, t.coursesTotal, t.coursesChange, t.assignments, t.assignmentsDue,
         t.studyHours, t.studyChange, t.gpa, t.gpaChange, t.progress, t.progressChange, t.avgScore, t.avgChange, t.streak);

  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d, i) =>
    db.prepare("INSERT INTO study_week (user_id,day,pct) VALUES (?,?,?)").run(uid, d, s.week[i]));
}

if (SEED_DEMO && db.prepare("SELECT COUNT(*) AS n FROM users").get().n === 0) {
  seedStudent({
    username: "mark", password: "password123", fullName: "Mark Harold", initials: "MH", program: "Eng",
    courses: [
      { name: "Calculus 2", professor: "Dr. Rommel T. Dasalla", badge: "CS", color: "blue", progress: 82, credits: 3 },
      { name: "ENGADS01", professor: "Sir Jerry Sermeno", badge: "AI", color: "purple", progress: 74, credits: 4 },
      { name: "COEPRO01", professor: "Sir Conrad Hidalgo", badge: "DB", color: "green", progress: 91, credits: 3 },
    ],
    schedule: [
      ["Monday", "Data Structures", "Room 101", "09:00 - 10:30 AM"],
      ["Monday", "Database Systems", "Room 205", "11:00 AM - 12:30 PM"],
      ["Tuesday", "AI & Machine Learning", "Room 301", "10:00 - 11:30 AM"],
      ["Tuesday", "Programming Lab", "Room 401", "02:00 - 03:30 PM"],
      ["Wednesday", "Web Development", "Room 501", "09:30 - 11:00 AM"],
    ],
    assessments: [
      { title: "AI Project Proposal", level: "urgent", badge: "URGENT", deadline: "Today, 5:00 PM", details: [
        ["Course", "Artificial Intelligence"], ["Deadline", "Today, 5:00 PM"], ["Status", "Not Started"], ["Weight", "20%"]] },
      { title: "Algorithms Quiz", level: "important", badge: "THIS WEEK", deadline: "Tomorrow, 10:00 AM", details: [
        ["Course", "Data Structures"], ["Deadline", "Tomorrow, 10:00 AM"], ["Duration", "60 minutes"],
        ["Questions", "25 (Multiple Choice + Short Answer)"], ["Topics", "Sorting, Searching, Graphs"]] },
      { title: "DB Lab Submission", level: "", badge: "NEXT WEEK", deadline: "Friday, 11:59 PM", details: [
        ["Course", "Database Systems"], ["Deadline", "Friday, 11:59 PM"], ["Type", "Lab Assignment"],
        ["Status", "In Progress (60% Complete)"]] },
    ],
    stats: { gwa: 1.25, gwaChange: 0.12, coursesDone: 12, coursesTotal: 15, coursesChange: 2, assignments: 4, assignmentsDue: 2,
             studyHours: 18, studyChange: 4, gpa: 3.88, gpaChange: 0.12, progress: 80, progressChange: 5,
             avgScore: 87, avgChange: 3, streak: 12 },
    week: [60, 75, 45, 90, 70, 55, 40],
  });

  seedStudent({
    username: "juan", password: "password123", fullName: "Juan Dela Cruz", initials: "JD", program: "CompSci",
    courses: [
      { name: "Physics 1", professor: "Dr. Ana Villanueva", badge: "PH", color: "blue", progress: 65, credits: 3 },
      { name: "Intro to Programming", professor: "Sir Carlo Mendoza", badge: "IP", color: "purple", progress: 88, credits: 3 },
      { name: "Technical Writing", professor: "Ma'am Liza Cruz", badge: "TW", color: "green", progress: 70, credits: 2 },
    ],
    schedule: [
      ["Monday", "Physics 1", "Room 110", "08:00 - 09:30 AM"],
      ["Thursday", "Intro to Programming", "Lab 2", "01:00 - 02:30 PM"],
      ["Friday", "Technical Writing", "Room 204", "10:00 - 11:30 AM"],
    ],
    assessments: [
      { title: "Physics Problem Set 3", level: "important", badge: "THIS WEEK", deadline: "Wednesday, 8:00 PM", details: [
        ["Course", "Physics 1"], ["Deadline", "Wednesday, 8:00 PM"], ["Status", "In Progress"]] },
      { title: "Programming Midterm", level: "urgent", badge: "URGENT", deadline: "Tomorrow, 1:00 PM", details: [
        ["Course", "Intro to Programming"], ["Deadline", "Tomorrow, 1:00 PM"], ["Duration", "90 minutes"]] },
    ],
    stats: { gwa: 1.75, gwaChange: 0.05, coursesDone: 6, coursesTotal: 15, coursesChange: 1, assignments: 2, assignmentsDue: 1,
             studyHours: 11, studyChange: 2, gpa: 3.4, gpaChange: 0.05, progress: 41, progressChange: 3,
             avgScore: 80, avgChange: 1, streak: 4 },
    week: [30, 50, 65, 40, 55, 20, 10],
  });
  console.log("Database created with sample students: mark / juan (password: password123)");
}

// =====================================================
// LOGIN / SESSIONS
// =====================================================
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_BASE = `HttpOnly; Path=/; SameSite=Lax${IS_PROD ? "; Secure" : ""}`;

// burahin ang mga lumang session
db.prepare("DELETE FROM sessions WHERE created_at < ?").run(Date.now() - WEEK_MS);

// ---- limit sa maling login at sa dami ng register ----
const MAX_FAILS = 5;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const failedLogins = new Map(); // "ip|username" -> { count, resetAt }
const registrations = new Map(); // ip -> { count, resetAt }

function isBlocked(key) {
  const e = failedLogins.get(key);
  if (!e) return false;
  if (Date.now() > e.resetAt) { failedLogins.delete(key); return false; }
  return e.count >= MAX_FAILS;
}
function recordFail(key) {
  const now = Date.now();
  const e = failedLogins.get(key);
  if (!e || now > e.resetAt) failedLogins.set(key, { count: 1, resetAt: now + FAIL_WINDOW_MS });
  else e.count++;
}
function allowRegister(ip) {
  const now = Date.now();
  const e = registrations.get(ip);
  if (!e || now > e.resetAt) { registrations.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); return true; }
  return ++e.count <= 10; // 10 accounts bawat oras bawat IP
}
setInterval(() => {
  const now = Date.now();
  for (const m of [failedLogins, registrations]) for (const [k, v] of m) if (now > v.resetAt) m.delete(k);
}, 10 * 60 * 1000).unref();

function getCookie(req, name) {
  const part = (req.headers.cookie || "").split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

function requireAuth(req, res, next) {
  const token = getCookie(req, "sid");
  const user = token && db
    .prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.created_at > ?")
    .get(token, Date.now() - WEEK_MS);
  if (!user) return res.status(401).json({ error: "Not logged in" });
  req.user = user;
  next();
}

const publicUser = (u) => ({ id: u.id, username: u.username, fullName: u.full_name, initials: u.initials, program: u.program });

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });
  const uname = String(username).trim().toLowerCase();
  const key = `${req.ip}|${uname}`;
  if (isBlocked(key)) return res.status(429).json({ error: "Too many failed attempts. Please try again in 15 minutes." });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(uname);
  if (!user || !checkPassword(String(password), user)) {
    recordFail(key);
    return res.status(401).json({ error: "Wrong username or password" });
  }
  failedLogins.delete(key);
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)").run(token, user.id, Date.now());
  res.setHeader("Set-Cookie", `sid=${token}; ${COOKIE_BASE}; Max-Age=${WEEK_MS / 1000}`);
  res.json(publicUser(user));
});

// Gumawa ng bagong student account (auto-login pagkatapos)
app.post("/api/register", (req, res) => {
  if (!allowRegister(req.ip)) return res.status(429).json({ error: "Too many accounts created. Please try again later." });
  const { fullName, username, password, program } = req.body || {};
  const name = String(fullName || "").trim();
  const uname = String(username || "").trim().toLowerCase();
  const pass = String(password || "");
  if (name.length < 2) return res.status(400).json({ error: "Full name is required" });
  if (!/^[a-z0-9_]{3,20}$/.test(uname))
    return res.status(400).json({ error: "Username must be 3-20 characters: letters, numbers, or _" });
  if (pass.length < 6 || pass.length > 100)
    return res.status(400).json({ error: "Password must be 6 to 100 characters" });
  if (db.prepare("SELECT id FROM users WHERE username = ?").get(uname))
    return res.status(409).json({ error: "Username is already taken" });

  const salt = crypto.randomBytes(16).toString("hex");
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const prog = String(program || "").trim().slice(0, 30) || "Student";
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (username, password_hash, salt, full_name, initials, program) VALUES (?,?,?,?,?,?)")
    .run(uname, hashPassword(pass, salt), salt, name, initials, prog);
  const uid = Number(lastInsertRowid);

  // walang laman ang bagong account: zero stats at blangkong study chart
  db.prepare("INSERT INTO stats VALUES (?,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)").run(uid);
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) =>
    db.prepare("INSERT INTO study_week (user_id,day,pct) VALUES (?,?,0)").run(uid, d));

  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)").run(token, uid, Date.now());
  res.setHeader("Set-Cookie", `sid=${token}; ${COOKIE_BASE}; Max-Age=${WEEK_MS / 1000}`);
  res.status(201).json(publicUser({ id: uid, username: uname, full_name: name, initials, program: prog }));
});

app.post("/api/logout", (req, res) => {
  const token = getCookie(req, "sid");
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.setHeader("Set-Cookie", "sid=; HttpOnly; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => res.json(publicUser(req.user)));

// =====================================================
// STUDENT DATA (bawat student ay sariling data lang ang nakikita)
// =====================================================
const getStats = (uid) => {
  const t = db.prepare("SELECT * FROM stats WHERE user_id = ?").get(uid);
  return {
    gwa: t.gwa, gwaChange: t.gwa_change, coursesDone: t.courses_done, coursesTotal: t.courses_total,
    coursesChange: t.courses_change, assignments: t.assignments, assignmentsDue: t.assignments_due,
    studyHours: t.study_hours, studyChange: t.study_change, gpa: t.gpa, gpaChange: t.gpa_change,
    progress: t.progress, progressChange: t.progress_change, avgScore: t.avg_score, avgChange: t.avg_change,
    streak: t.streak,
  };
};
const getCourses = (uid) =>
  db.prepare("SELECT id,name,professor,badge,color,progress,credits,weeks,score FROM courses WHERE user_id = ? ORDER BY id").all(uid);
const getAssessments = (uid) =>
  db.prepare("SELECT * FROM assessments WHERE user_id = ? ORDER BY id").all(uid).map((a) => ({
    id: a.id, title: a.title, level: a.level, badge: a.badge, deadline: a.deadline,
    details: JSON.parse(a.details).map(([label, value]) => ({ label, value })),
  }));

app.get("/api/student/dashboard", requireAuth, (req, res) => {
  const uid = req.user.id;
  const dot = { urgent: "red", important: "yellow" };
  res.json({
    profile: publicUser(req.user),
    stats: getStats(uid),
    courses: getCourses(uid),
    tasks: getAssessments(uid).slice(0, 3).map((a) => ({ title: a.title, due: a.deadline, dot: dot[a.level] || "green" })),
    week: db.prepare("SELECT day, pct FROM study_week WHERE user_id = ? ORDER BY id").all(uid),
  });
});

app.get("/api/student/stats", requireAuth, (req, res) => res.json(getStats(req.user.id)));
app.get("/api/student/courses", requireAuth, (req, res) => res.json(getCourses(req.user.id)));
app.get("/api/student/assessments", requireAuth, (req, res) => res.json(getAssessments(req.user.id)));

app.get("/api/student/schedule", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM schedule WHERE user_id = ? ORDER BY day_order, id").all(req.user.id);
  const days = [];
  for (const r of rows) {
    let d = days.find((x) => x.day === r.day);
    if (!d) days.push((d = { day: r.day, classes: [] }));
    d.classes.push({ name: r.name, room: r.room, time: r.time });
  }
  res.json(days);
});

// Magdagdag ng assessment (nai-save sa database)
app.post("/api/student/assessments", requireAuth, (req, res) => {
  const { title, course, deadline, level } = req.body || {};
  if (!title || !deadline) return res.status(400).json({ error: "title and deadline are required" });
  const lv = ["urgent", "important"].includes(level) ? level : "";
  const badge = { urgent: "URGENT", important: "THIS WEEK" }[lv] || "UPCOMING";
  const details = [["Course", course || "-"], ["Deadline", deadline], ["Status", "Not Started"]];
  const { lastInsertRowid } = db
    .prepare("INSERT INTO assessments (user_id,title,level,badge,deadline,details) VALUES (?,?,?,?,?,?)")
    .run(req.user.id, title, lv, badge, deadline, JSON.stringify(details));
  res.status(201).json({ id: Number(lastInsertRowid), title, level: lv, badge, deadline });
});

// Magdagdag ng course
app.post("/api/student/courses", requireAuth, (req, res) => {
  const { name, professor, credits, score } = req.body || {};
  const cname = String(name || "").trim();
  if (!cname) return res.status(400).json({ error: "name is required" });
  const cr = credits === undefined || credits === "" ? 3 : Number(credits);
  if (!Number.isInteger(cr) || cr < 1 || cr > 10) return res.status(400).json({ error: "credits must be 1 to 10" });
  let sc = null;
  if (score !== undefined && score !== null && score !== "") {
    sc = Number(score);
    if (!Number.isInteger(sc) || sc < 0 || sc > 100) return res.status(400).json({ error: "score must be 0 to 100" });
  }
  const words = cname.split(/\s+/);
  const badge = (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : cname.slice(0, 2)).toUpperCase();
  const count = db.prepare("SELECT COUNT(*) AS n FROM courses WHERE user_id = ?").get(req.user.id).n;
  const color = ["blue", "purple", "green"][count % 3];
  const prof = String(professor || "").trim() || "TBA";
  const { lastInsertRowid } = db
    .prepare("INSERT INTO courses (user_id,name,professor,badge,color,progress,credits,weeks,score) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(req.user.id, cname, prof, badge, color, 0, cr, 16, sc);
  res.status(201).json({ id: Number(lastInsertRowid), name: cname, professor: prof, badge, color, progress: 0, credits: cr, weeks: 16, score: sc });
});

// I-update ang progress at/o score ng course
app.patch("/api/student/courses/:id", requireAuth, (req, res) => {
  const body = req.body || {};
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!course) return res.status(404).json({ error: "course not found" });
  const valid = (v) => Number.isInteger(v) && v >= 0 && v <= 100;
  let progress = course.progress;
  let score = course.score;
  if (body.progress !== undefined) {
    progress = Number(body.progress);
    if (!valid(progress)) return res.status(400).json({ error: "progress must be a whole number from 0 to 100" });
  }
  if (body.score !== undefined) {
    score = body.score === null || body.score === "" ? null : Number(body.score);
    if (score !== null && !valid(score)) return res.status(400).json({ error: "score must be a whole number from 0 to 100" });
  }
  db.prepare("UPDATE courses SET progress = ?, score = ? WHERE id = ? AND user_id = ?").run(progress, score, course.id, req.user.id);
  res.json({ id: course.id, progress, score });
});

// I-delete ang course (sariling course lang ng student)
app.delete("/api/student/courses/:id", requireAuth, (req, res) => {
  const r = db.prepare("DELETE FROM courses WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: "course not found" });
  res.json({ deleted: Number(req.params.id) });
});

// Course Performance (Analytics): letter grade galing sa score ng bawat course
function letterGrade(score) {
  if (score >= 90) return { grade: "A", level: "excellent", remark: "Excellent Performance" };
  if (score >= 80) return { grade: "B+", level: "good", remark: "Good Progress" };
  if (score >= 70) return { grade: "B", level: "average", remark: "Needs Improvement" };
  if (score >= 60) return { grade: "C", level: "poor", remark: "At Risk" };
  return { grade: "D", level: "poor", remark: "At Risk" };
}

app.get("/api/student/performance", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT name, score FROM courses WHERE user_id = ? AND score IS NOT NULL ORDER BY id").all(req.user.id);
  res.json(rows.map((r) => ({ name: r.name, score: r.score, ...letterGrade(r.score) })));
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON" });
  console.error(err);
  res.status(err.status || 500).json({ error: "Server error" });
});

app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
