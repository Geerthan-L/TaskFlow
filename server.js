// ============================================================
//  TaskFlow – Node.js + Express + MySQL Backend
//  Run: node server.js
//  Requires: npm install express mysql2 cors dotenv bcryptjs jsonwebtoken
// ============================================================

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "taskflow_dev_secret_change_in_prod";

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

// ── DB Pool ───────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "taskflow",
  waitForConnections: true,
  connectionLimit: 10,
});

// ── Auth Middleware ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Helper ────────────────────────────────────────────────────
const db = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// ════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, and password are required" });

    const existing = await db("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await db(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );
    const token = jwt.sign({ id: result.insertId, name, email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: result.insertId, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const [user] = await db("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db("SELECT id, name, email FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/auth/profile – update name & email
app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

    // Check if email is already taken by another user
    const existing = await db("SELECT id FROM users WHERE email = ? AND id != ?", [email, req.user.id]);
    if (existing.length) return res.status(409).json({ error: "Email already in use" });

    await db("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, req.user.id]);
    const [user] = await db("SELECT id, name, email FROM users WHERE id = ?", [req.user.id]);
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/auth/password – change password
app.put("/api/auth/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords are required" });
    if (newPassword.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });

    const [user] = await db("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  PROJECT ROUTES  (all protected)
// ════════════════════════════════════════════════════════════

// GET /api/projects  – all projects for logged-in user (with task counts)
app.get("/api/projects", authMiddleware, async (req, res) => {
  try {
    const projects = await db(
      `SELECT p.*,
         COUNT(t.id)                                      AS taskCount,
         SUM(t.status = 'Done')                           AS completedCount
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/projects
app.post("/api/projects", authMiddleware, async (req, res) => {
  try {
    const { title, color } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const result = await db(
      "INSERT INTO projects (user_id, title, color) VALUES (?, ?, ?)",
      [req.user.id, title, color || "#6C63FF"]
    );
    const [project] = await db("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    await logActivity(req.user.id, "CREATE", "project", project.id, `Created project: ${title}`);
    res.status(201).json({ ...project, taskCount: 0, completedCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/projects/:id
app.put("/api/projects/:id", authMiddleware, async (req, res) => {
  try {
    const { title, color } = req.body;
    await db(
      "UPDATE projects SET title = ?, color = ? WHERE id = ? AND user_id = ?",
      [title, color, req.params.id, req.user.id]
    );
    const [project] = await db("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/:id
app.delete("/api/projects/:id", authMiddleware, async (req, res) => {
  try {
    // Cascade delete tasks (or rely on FK constraint)
    await db("DELETE FROM tasks WHERE project_id = ?", [req.params.id]);
    await db("DELETE FROM projects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    await logActivity(req.user.id, "DELETE", "project", parseInt(req.params.id), `Deleted project`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  TASK ROUTES  (all protected)
// ════════════════════════════════════════════════════════════

// GET /api/tasks  – all tasks (optionally filter by ?projectId=X)
app.get("/api/tasks", authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.query;
    let sql = `
      SELECT t.* FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE p.user_id = ?`;
    const params = [req.user.id];

    if (projectId) {
      sql += " AND t.project_id = ?";
      params.push(projectId);
    }
    sql += " ORDER BY t.created_at DESC";

    const tasks = await db(sql, params);
    // Normalize project_id → projectId for the frontend
    res.json(tasks.map(t => ({ ...t, projectId: t.project_id })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/tasks/:id
app.get("/api/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const [task] = await db(
      `SELECT t.* FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ ...task, projectId: task.project_id });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/tasks
app.post("/api/tasks", authMiddleware, async (req, res) => {
  try {
    const { projectId, title, description, status, priority, due_date } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: "Title and projectId are required" });

    // Verify ownership
    const [proj] = await db("SELECT id FROM projects WHERE id = ? AND user_id = ?", [projectId, req.user.id]);
    if (!proj) return res.status(403).json({ error: "Project not found or access denied" });

    const result = await db(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [projectId, title, description || "", status || "To Do", priority || "Medium", due_date || null]
    );
    const [task] = await db("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
    await logActivity(req.user.id, "CREATE", "task", task.id, `Created task: ${title}`);
    res.status(201).json({ ...task, projectId: task.project_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/tasks/:id
app.put("/api/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, due_date, projectId } = req.body;

    // Verify ownership via project
    const [existing] = await db(
      `SELECT t.id FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: "Task not found" });

    // Normalize due_date: extract YYYY-MM-DD or set null
    let normalizedDate = null;
    if (due_date && due_date !== "") {
      const d = new Date(due_date);
      if (!isNaN(d.getTime())) {
        normalizedDate = d.toISOString().slice(0, 10);
      }
    }

    await db(
      `UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=?, project_id=?
       WHERE id=?`,
      [title, description || "", status, priority, normalizedDate, projectId, req.params.id]
    );
    const [task] = await db("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "UPDATE", "task", parseInt(req.params.id), `Updated task: ${title} (status: ${status})`);
    res.json({ ...task, projectId: task.project_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
  try {
    await db(
      `DELETE t FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );
    await logActivity(req.user.id, "DELETE", "task", parseInt(req.params.id), `Deleted task`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ════════════════════════════════════════════════════════════

// GET /api/dashboard
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const [[stats]] = [await db(
      `SELECT
         COUNT(*)                      AS totalTasks,
         SUM(t.status='Done')         AS doneTasks,
         SUM(t.status='In Progress')  AS inProgressTasks,
         SUM(t.status='To Do')        AS pendingTasks
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE p.user_id = ?`,
      [uid]
    )];
    const recentTasks = await db(
      `SELECT t.*, t.project_id AS projectId FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE p.user_id = ?
       ORDER BY t.created_at DESC LIMIT 5`,
      [uid]
    );
    res.json({ ...stats, recentTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  ACTIVITY LOGGING HELPER
// ════════════════════════════════════════════════════════════
async function logActivity(userId, action, entityType, entityId, details) {
  try {
    await db("INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?,?,?,?,?)",
      [userId, action, entityType, entityId, details || null]);
  } catch (e) { console.error("Log error:", e); }
}

// ════════════════════════════════════════════════════════════
//  TASK COMMENTS
// ════════════════════════════════════════════════════════════

// GET /api/tasks/:id/comments
app.get("/api/tasks/:id/comments", authMiddleware, async (req, res) => {
  try {
    const comments = await db(
      `SELECT c.*, u.name as user_name FROM task_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ? ORDER BY c.created_at DESC`, [req.params.id]);
    res.json(comments);
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// POST /api/tasks/:id/comments
app.post("/api/tasks/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: "Comment is required" });
    const result = await db("INSERT INTO task_comments (task_id, user_id, comment) VALUES (?,?,?)",
      [req.params.id, req.user.id, comment]);
    const [newComment] = await db(
      `SELECT c.*, u.name as user_name FROM task_comments c
       JOIN users u ON u.id = c.user_id WHERE c.id = ?`, [result.insertId]);
    await logActivity(req.user.id, "COMMENT", "task", parseInt(req.params.id), `Added comment on task`);
    res.status(201).json(newComment);
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// ════════════════════════════════════════════════════════════
//  ACTIVITY LOG
// ════════════════════════════════════════════════════════════
app.get("/api/logs", authMiddleware, async (req, res) => {
  try {
    const logs = await db(
      `SELECT a.*, u.name as user_name FROM activity_log a
       JOIN users u ON u.id = a.user_id
       WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 200`, [req.user.id]);
    res.json(logs);
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// ════════════════════════════════════════════════════════════
//  SQL TABLE VIEWER (for DBMS demonstration)
// ════════════════════════════════════════════════════════════
app.get("/api/tables", authMiddleware, async (req, res) => {
  try {
    const tables = await db("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    res.json(tableNames);
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

app.get("/api/tables/:name", authMiddleware, async (req, res) => {
  try {
    const allowed = ["users", "projects", "tasks", "task_comments", "activity_log"];
    if (!allowed.includes(req.params.name)) return res.status(403).json({ error: "Table not accessible" });
    const columns = await db(`SHOW COLUMNS FROM ${req.params.name}`);
    const rows = await db(`SELECT * FROM ${req.params.name} ORDER BY id DESC LIMIT 100`);
    // Mask password field
    const safeRows = rows.map(r => {
      const row = { ...r };
      if (row.password) row.password = "********";
      return row;
    });
    res.json({ columns: columns.map(c => ({ field: c.Field, type: c.Type, key: c.Key, nullable: c.Null, default: c.Default })), rows: safeRows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// ════════════════════════════════════════════════════════════
//  EXPORT REPORTS
// ════════════════════════════════════════════════════════════

// GET /api/export/csv – Download tasks as CSV
app.get("/api/export/csv", authMiddleware, async (req, res) => {
  try {
    const { project, status, priority } = req.query;
    let sql = `SELECT t.id, t.title, t.description, t.status, t.priority,
               p.title as project_name, t.due_date, t.created_at
               FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
               WHERE p.user_id = ?`;
    const params = [req.user.id];
    if (project && project !== "All") { sql += " AND t.project_id = ?"; params.push(project); }
    if (status && status !== "All") { sql += " AND t.status = ?"; params.push(status); }
    if (priority && priority !== "All") { sql += " AND t.priority = ?"; params.push(priority); }
    sql += " ORDER BY t.created_at DESC";
    const rows = await db(sql, params);

    const escape = (v) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    const header = "ID,Title,Description,Status,Priority,Project,Due Date,Created At";
    const csvRows = rows.map(r =>
      [r.id, r.title, r.description || "", r.status, r.priority, r.project_name || "None",
       r.due_date ? new Date(r.due_date).toISOString().split("T")[0] : "",
       new Date(r.created_at).toISOString().replace("T", " ").substring(0, 19)
      ].map(escape).join(",")
    );
    const csv = [header, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=taskflow_report_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// GET /api/export/report-data – Get enhanced report data with aggregations
app.get("/api/export/report-data", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const tasks = await db(
      `SELECT t.*, p.title as project_name FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = ? ORDER BY t.created_at DESC`, [uid]);
    const projects = await db(
      `SELECT p.*,
       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Done') as done_count
       FROM projects p WHERE p.user_id = ?`, [uid]);
    const statusBreakdown = await db(
      `SELECT t.status, COUNT(*) as count FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = ? GROUP BY t.status`, [uid]);
    const priorityBreakdown = await db(
      `SELECT t.priority, COUNT(*) as count FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = ? GROUP BY t.priority`, [uid]);
    const overdueTasks = await db(
      `SELECT COUNT(*) as count FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = ? AND t.due_date < CURDATE() AND t.status != 'Done'`, [uid]);
    const recentActivity = await db(
      `SELECT a.*, u.name as user_name FROM activity_log a
       JOIN users u ON u.id = a.user_id WHERE a.user_id = ?
       ORDER BY a.created_at DESC LIMIT 10`, [uid]);

    res.json({
      tasks, projects, statusBreakdown, priorityBreakdown,
      overdueCount: overdueTasks[0]?.count || 0,
      recentActivity,
      generatedAt: new Date().toISOString()
    });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`✅  TaskFlow API running on http://localhost:${PORT}`));
