import { useState, useEffect, useCallback, useRef } from "react";

const API = "/api";
async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const PRIORITY_CONFIG = {
  High: { color: "#FF6B6B", dot: "#FF6B6B", icon: "🔴" },
  Medium: { color: "#FFD166", dot: "#FFD166", icon: "🟡" },
  Low: { color: "#43D9AD", dot: "#43D9AD", icon: "🟢" },
};
const STATUS_CONFIG = {
  "To Do": { bg: "rgba(108,99,255,0.15)", text: "#A89FF7", icon: "📋", gradient: "linear-gradient(135deg,#6C63FF,#9B88FF)" },
  "In Progress": { bg: "rgba(255,209,102,0.15)", text: "#FFD166", icon: "⚡", gradient: "linear-gradient(135deg,#FFD166,#FFB347)" },
  "Done": { bg: "rgba(67,217,173,0.15)", text: "#43D9AD", icon: "✅", gradient: "linear-gradient(135deg,#43D9AD,#36BA98)" },
};
const STATUSES = ["To Do", "In Progress", "Done"];

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString();
}

// ═══════════════ ROOT ═══════════════
export default function Root() {
  const [token, setToken] = useState(() => localStorage.getItem("tf_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tf_user")); } catch { return null; }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("tf_theme") || "dark");
  const [accent, setAccent] = useState(() => localStorage.getItem("tf_accent") || "purple");
  function onLogin(tok, usr) {
    localStorage.setItem("tf_token", tok);
    localStorage.setItem("tf_user", JSON.stringify(usr));
    setToken(tok); setUser(usr);
  }
  function onLogout() {
    localStorage.removeItem("tf_token");
    localStorage.removeItem("tf_user");
    setToken(null); setUser(null);
  }
  function updateUser(tok, usr) {
    if (tok) localStorage.setItem("tf_token", tok);
    localStorage.setItem("tf_user", JSON.stringify(usr));
    if (tok) setToken(tok);
    setUser(usr);
  }
  function toggleTheme() {
    const t = theme === "dark" ? "light" : "dark";
    localStorage.setItem("tf_theme", t); setTheme(t);
  }
  function changeAccent(a) { localStorage.setItem("tf_accent", a); setAccent(a); }
  if (!token || !user) return <AuthPage onLogin={onLogin} theme={theme} />;
  return <TaskFlow token={token} user={user} onLogout={onLogout} theme={theme} toggleTheme={toggleTheme} accent={accent} changeAccent={changeAccent} updateUser={updateUser} />;
}

// ═══════════════ AUTH PAGE ═══════════════
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const data = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      onLogin(data.token, data.user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const s = makeStyles(true);
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0E0E14 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div className="slide-up" style={{ background: "rgba(19,19,28,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 24, padding: 40, width: 400, maxWidth: "90vw", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div className="pulse-glow" style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6C63FF,#9B88FF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>TF</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, background: "linear-gradient(135deg,#6C63FF,#9B88FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TaskFlow</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, color: "#E8E8F0", marginBottom: 6 }}>
            {mode === "login" ? "Welcome back ✨" : "Create account 🚀"}
          </div>
          <div style={{ fontSize: 14, color: "#7070A0", marginBottom: 28 }}>
            {mode === "login" ? "Sign in to your workspace" : "Start managing your tasks"}
          </div>
          {error && <div className="fade-in" style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 12, padding: "10px 14px", color: "#FF6B6B", fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div><label style={s.label}>Name</label>
                <input className="input-glow" style={s.input} placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            )}
            <div><label style={s.label}>Email</label>
              <input className="input-glow" style={s.input} placeholder="you@example.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label style={s.label}>Password</label>
              <input className="input-glow" style={s.input} placeholder="••••••••" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submit()} /></div>
            <button className="btn-primary" onClick={submit} disabled={loading} style={{ ...s.btn("primary"), marginTop: 8, opacity: loading ? 0.7 : 1, height: 44, fontSize: 14 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#7070A0" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#6C63FF", cursor: "pointer", fontWeight: 600 }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════ MAIN APP ═══════════════
function TaskFlow({ token, user, onLogout, theme, toggleTheme, accent, changeAccent, updateUser }) {
  const [page, setPage] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [projectModal, setProjectModal] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterProject, setFilterProject] = useState("All");

  const api = useCallback((path, opts) => apiFetch(path, opts, token), [token]);

  useEffect(() => { fetchProjects(); fetchDashboard(); }, []);
  useEffect(() => { fetchTasks(); }, [activeProject]);

  async function fetchProjects() { try { setProjects(await api("/projects")); } catch (e) { console.error(e); } }
  async function fetchTasks() {
    try {
      const url = activeProject ? `/tasks?projectId=${activeProject}` : "/tasks";
      setTasks(await api(url));
    } catch (e) { console.error(e); }
  }
  async function fetchDashboard() { try { setDashboard(await api("/dashboard")); } catch (e) { console.error(e); } }

  async function addTask(formData) {
    setLoading(true);
    try {
      const t = await api("/tasks", { method: "POST", body: JSON.stringify(formData) });
      setTasks(prev => [t, ...prev]); setTaskModal(null);
      fetchDashboard(); fetchProjects();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }
  async function updateTask(updated) {
    try {
      const payload = { ...updated, projectId: updated.projectId || updated.project_id };
      const t = await api(`/tasks/${updated.id}`, { method: "PUT", body: JSON.stringify(payload) });
      setTasks(prev => prev.map(x => x.id === t.id ? t : x));
      if (detailTask?.id === t.id) setDetailTask(t);
      fetchDashboard(); fetchProjects();
    } catch (e) { alert(e.message); }
  }
  async function deleteTask(id) {
    try {
      await api(`/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
      if (detailTask?.id === id) setDetailTask(null);
      fetchDashboard(); fetchProjects();
    } catch (e) { alert(e.message); }
  }
  async function addProject(data) {
    try {
      const p = await api("/projects", { method: "POST", body: JSON.stringify(data) });
      setProjects(prev => [{ ...p, taskCount: 0, completedCount: 0 }, ...prev]);
      setProjectModal(false);
    } catch (e) { alert(e.message); }
  }
  async function deleteProject(id) {
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => (t.projectId || t.project_id) !== id));
      if (activeProject === id) { setActiveProject(null); setPage("projects"); }
      fetchDashboard();
    } catch (e) { alert(e.message); }
  }

  const s = makeStyles(sidebarOpen, theme, accent);
  const nav = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "tasks", icon: "✦", label: "Tasks" },
    { id: "board", icon: "⊞", label: "Kanban Board" },
    { id: "projects", icon: "⬡", label: "Projects" },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "log", icon: "☰", label: "Logs" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

  // Filter tasks by search + priority + project
  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(t.description || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== "All" && t.priority !== filterPriority) return false;
    if (filterProject !== "All" && (t.projectId || t.project_id) !== Number(filterProject)) return false;
    return true;
  });

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      <div style={s.root}>
        <div style={s.sidebar}>
          <div style={s.sidebarTop}>
            {sidebarOpen ? (
              <>
                <div className="pulse-glow" style={s.logoIcon}>TF</div>
                <span style={s.logo}>TaskFlow</span>
                <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: s.textMuted, cursor: "pointer", fontSize: 18, flexShrink: 0, padding: "4px 6px", borderRadius: 6 }}>☰</button>
              </>
            ) : (
              <button onClick={() => setSidebarOpen(true)} style={{ margin: "0 auto", background: "none", border: "none", color: s.textMuted, cursor: "pointer", fontSize: 20, padding: "4px", borderRadius: 6 }}>☰</button>
            )}
          </div>
          <div style={{ padding: "16px 10px", flex: 1 }}>
            {nav.map((n, i) => (
              <div key={n.id} className="nav-item-hover" style={{ ...s.navItem(page === n.id), animationDelay: `${i * 50}ms` }}
                onClick={() => { setPage(n.id); if (n.id !== "tasks") setActiveProject(null); }}>
                <span style={s.navIcon}>{n.icon}</span>
                <span style={{ opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s" }}>{n.label}</span>
                {page === n.id && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: s.accent.primary, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 10px", borderTop: "1px solid #1E1E2E" }}>
            <div className="nav-item-hover" style={s.navItem(false)} onClick={onLogout}>
              <span style={s.navIcon}>⏻</span>
              <span style={{ opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s", color: "#FF6B6B" }}>Logout</span>
            </div>
            {sidebarOpen && <div style={{ padding: "8px 16px", fontSize: 12, color: "#5050A0" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#6C63FF,#9B88FF)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, marginRight: 8, verticalAlign: "middle" }}>{user.name?.[0]?.toUpperCase()}</div>
              {user.name}
            </div>}
          </div>
        </div>

        <div style={s.main}>
          <div style={s.topbar}>
            <div style={s.pageTitle}>
              {page === "dashboard" ? "Dashboard"
                : page === "board" ? "Kanban Board"
                  : page === "tasks" ? (activeProject ? (projects.find(p => p.id === activeProject)?.title || "") + " – Tasks" : "All Tasks")
                    : page === "settings" ? "Settings"
                      : page === "log" ? "SQL Database Viewer"
                        : page === "reports" ? "Export Reports"
                          : "Projects"}
            </div>
            {(page === "tasks" || page === "board") && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
                <div style={{ position: "relative", maxWidth: 240 }}>
                  <input className="input-glow" placeholder="🔍 Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ ...s.input, padding: "8px 14px", fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid #1E1E2E", width: "100%" }} />
                </div>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                  style={{ ...s.select, width: "auto", padding: "8px 12px", fontSize: 12, background: "rgba(255,255,255,0.04)", minWidth: 100 }}>
                  <option value="All">All Priority</option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                  style={{ ...s.select, width: "auto", padding: "8px 12px", fontSize: 12, background: "rgba(255,255,255,0.04)", minWidth: 110 }}>
                  <option value="All">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>● {p.title}</option>)}
                </select>
                <button className="btn-primary" style={s.btn("primary")} onClick={() => setTaskModal("new")}>+ New Task</button>
              </div>
            )}
            {page === "projects" && <button className="btn-primary" style={s.btn("primary")} onClick={() => setProjectModal(true)}>+ New Project</button>}
          </div>
          <div style={s.content}>
            {page === "dashboard" && dashboard && (
              <DashboardPage s={s} dashboard={dashboard} projects={projects}
                openTaskDetail={setDetailTask}
                gotoTasks={() => setPage("tasks")} gotoProjects={() => setPage("projects")} />
            )}
            {page === "dashboard" && !dashboard && <div style={{ color: "#5050A0", padding: 40 }}>Loading dashboard…</div>}
            {page === "tasks" && (
              <TasksPage s={s} tasks={filteredTasks} projects={projects}
                openTaskDetail={setDetailTask} deleteTask={deleteTask} updateTask={updateTask} />
            )}
            {page === "board" && (
              <KanbanBoard s={s} tasks={filteredTasks} projects={projects}
                openTaskDetail={setDetailTask} updateTask={updateTask} deleteTask={deleteTask} />
            )}
            {page === "projects" && (
              <ProjectsPage s={s} projects={projects} tasks={tasks}
                openProject={id => { setActiveProject(id); setPage("tasks"); }}
                deleteProject={deleteProject} />
            )}
            {page === "settings" && (
              <SettingsPage s={s} user={user} token={token} api={api} theme={theme} toggleTheme={toggleTheme} accent={accent} changeAccent={changeAccent} updateUser={updateUser} onLogout={onLogout} />
            )}
            {page === "log" && (
              <LogPage s={s} api={api} />
            )}
            {page === "reports" && (
              <ReportsPage s={s} api={api} />
            )}
          </div>
        </div>

        {detailTask && <TaskDetailModal s={s} task={detailTask} projects={projects} api={api}
          onClose={() => setDetailTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}
        {taskModal === "new" && <NewTaskModal s={s} projects={projects} defaultProjectId={activeProject}
          onClose={() => setTaskModal(null)} onSave={addTask} loading={loading} />}
        {projectModal && <NewProjectModal s={s} onClose={() => setProjectModal(false)} onSave={addProject} />}
      </div>
    </>
  );
}

// ═══════════════ DASHBOARD ═══════════════
function DashboardPage({ s, dashboard, projects, openTaskDetail, gotoTasks, gotoProjects }) {
  const { totalTasks = 0, doneTasks = 0, inProgressTasks = 0, pendingTasks = 0, recentTasks = [] } = dashboard;
  const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const stats = [
    { label: "Total Tasks", val: totalTasks, color: "#6C63FF", icon: "📊" },
    { label: "Completed", val: doneTasks, color: "#43D9AD", icon: "✅" },
    { label: "Pending", val: pendingTasks, color: "#FFD166", icon: "⏳" },
    { label: "In Progress", val: inProgressTasks, color: "#FF6B6B", icon: "🔥" },
  ];
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {stats.map((st, i) => (
          <div key={st.label} className="stat-card" style={{ ...s.statCard(st.color), animationDelay: `${i * 80}ms`, animation: "cardEnter 0.4s ease-out both", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, fontSize: 60, opacity: 0.06 }}>{st.icon}</div>
            <div style={{ fontSize: 12, color: s.textMuted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{st.label}</div>
            <div style={{ ...s.statNum, color: st.color, animation: "countUp 0.5s ease-out both", animationDelay: `${i * 100 + 200}ms` }}>{st.val ?? 0}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={s.sectionTitle}>📋 Recent Tasks</div>
            <span onClick={gotoTasks} style={{ fontSize: 12, color: s.accent.primary, cursor: "pointer", fontWeight: 600 }}>View all →</span>
          </div>
          {recentTasks.map((t, i) => (
            <div key={t.id} className="task-row-hover" style={{ ...s.taskRow(false), animationDelay: `${i * 60}ms`, animation: "fadeIn 0.3s ease-out both" }}
              onClick={() => openTaskDetail(t)}>
              <div style={s.priorityDot(PRIORITY_CONFIG[t.priority]?.dot || "#888")} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
              <div style={s.badge(STATUS_CONFIG[t.status] || STATUS_CONFIG["To Do"])}>{t.status}</div>
            </div>
          ))}
          {recentTasks.length === 0 && <div style={{ color: "#5050A0", fontSize: 13, padding: 20, textAlign: "center" }}>No tasks yet! Create your first task 🎯</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.4s" }}>
            <div style={s.sectionTitle}>📈 Overall Progress</div>
            <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg,#6C63FF,#43D9AD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{percent}%</div>
            <div style={{ marginTop: 12, height: 10, background: s.trackBg, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${percent}%`, height: "100%", background: `linear-gradient(90deg,${s.accent.primary},#43D9AD)`, borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
            </div>
            <div style={{ fontSize: 12, color: s.textMuted, marginTop: 8 }}>{doneTasks} of {totalTasks} tasks completed</div>
          </div>
          <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.5s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={s.sectionTitle}>🗂️ Projects</div>
              <span onClick={gotoProjects} style={{ fontSize: 12, color: s.accent.primary, cursor: "pointer", fontWeight: 600 }}>View all →</span>
            </div>
            {projects.map(p => (
              <div key={p.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  <span><span style={{ color: p.color }}>●</span> {p.title}</span>
                  <span style={{ color: s.textMuted, fontWeight: 400 }}>{p.completedCount ?? 0}/{p.taskCount ?? 0}</span>
                </div>
                <div style={{ height: 5, background: s.trackBg, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: p.taskCount ? `${Math.round(((p.completedCount || 0) / p.taskCount) * 100)}%` : "0%", height: "100%", background: p.color, borderRadius: 99, transition: "width 0.6s" }} />
                </div>
              </div>
            ))}
            {projects.length === 0 && <div style={{ color: "#5050A0", fontSize: 13, textAlign: "center", padding: 12 }}>No projects yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════ KANBAN BOARD ═══════════════
function KanbanBoard({ s, tasks, projects, openTaskDetail, updateTask, deleteTask }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  function onDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");
  }
  function onDragEnd(e) {
    e.target.classList.remove("dragging");
    setDraggedTask(null); setDragOverCol(null);
  }
  function onDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  }
  function onDragLeave() { setDragOverCol(null); }
  function onDrop(e, newStatus) {
    e.preventDefault(); setDragOverCol(null);
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTask({ ...draggedTask, projectId: draggedTask.projectId || draggedTask.project_id, status: newStatus });
    }
    setDraggedTask(null);
  }

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, height: "100%" }}>
      {STATUSES.map(status => {
        const cfg = STATUS_CONFIG[status];
        const colTasks = tasks.filter(t => t.status === status);
        return (
          <div key={status} className={`kanban-col ${dragOverCol === status ? "drag-over" : ""}`}
            style={{ background: s.colBg, border: `1px solid ${s.border}`, borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}
            onDragOver={e => onDragOver(e, status)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, status)}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cfg.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: cfg.text }}>{status}</div>
                <div style={{ fontSize: 11, color: s.textMuted }}>{colTasks.length} task{colTasks.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ marginLeft: "auto", width: 24, height: 24, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: cfg.text }}>{colTasks.length}</div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10, minHeight: 100 }}>
              {colTasks.map((t, i) => {
                const pid = t.projectId || t.project_id;
                const proj = projects.find(p => p.id === pid);
                const overdue = isOverdue(t.due_date) && t.status !== "Done";
                return (
                  <div key={t.id} className="kanban-card card-enter" draggable onDragStart={e => onDragStart(e, t)} onDragEnd={onDragEnd}
                    style={{ background: s.cardSolid, border: `1px solid ${overdue ? "rgba(255,107,107,0.3)" : s.border}`, borderRadius: 14, padding: 16, animationDelay: `${i * 50}ms`, borderLeft: `3px solid ${PRIORITY_CONFIG[t.priority]?.color || "#888"}` }}
                    onClick={() => openTaskDetail(t)}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, lineHeight: 1.4, color: t.status === "Done" ? s.textMuted : s.text, textDecoration: t.status === "Done" ? "line-through" : "none" }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 12, color: s.textMuted, marginBottom: 10, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.description}</div>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ ...s.badge({ bg: (PRIORITY_CONFIG[t.priority]?.color || "#888") + "22", text: PRIORITY_CONFIG[t.priority]?.color || "#888" }), fontSize: 10 }}>{t.priority}</span>
                      {proj && <span style={{ ...s.badge({ bg: proj.color + "22", text: proj.color }), fontSize: 10 }}>● {proj.title}</span>}
                      {t.due_date && <span style={{ fontSize: 10, color: overdue ? "#FF6B6B" : s.textMuted, marginLeft: "auto", fontWeight: overdue ? 600 : 400 }}>{overdue ? "⚠ " : "📅 "}{formatDate(t.due_date)}</span>}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: s.textMuted, fontSize: 13, fontStyle: "italic", border: `2px dashed ${s.border}`, borderRadius: 12, padding: 20 }}>Drop tasks here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════ TASKS LIST ═══════════════
function TasksPage({ s, tasks, projects, openTaskDetail, deleteTask, updateTask }) {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["All", "To Do", "In Progress", "Done"].map(f => (
          <button key={f} className="view-toggle-btn" onClick={() => setFilter(f)} style={{ padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", background: filter === f ? `linear-gradient(135deg,${s.accent.primary},${s.accent.secondary})` : (s.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"), color: filter === f ? "#fff" : s.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>{f}</button>
        ))}
      </div>
      <div style={s.card}>
        {shown.length === 0 && <div style={{ textAlign: "center", padding: 48, color: "#7070A0" }}>No tasks here yet. Create one! 🎯</div>}
        {shown.map((t, i) => {
          const pid = t.projectId || t.project_id;
          const proj = projects.find(p => p.id === pid);
          const overdue = isOverdue(t.due_date) && t.status !== "Done";
          return (
            <div key={t.id} className="task-row-hover" style={{ ...s.taskRow(false), marginBottom: 2, animation: "fadeIn 0.3s ease-out both", animationDelay: `${i * 40}ms` }}>
              <input type="checkbox" checked={t.status === "Done"} style={{ cursor: "pointer", accentColor: s.accent.primary, width: 18, height: 18 }}
                onClick={e => e.stopPropagation()}
                onChange={() => updateTask({ ...t, projectId: pid, status: t.status === "Done" ? "To Do" : "Done" })} />
              <div style={{ flex: 1 }} onClick={() => openTaskDetail(t)}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, textDecoration: t.status === "Done" ? "line-through" : "none", color: t.status === "Done" ? s.textMuted : s.text }}>{t.title}</div>
                <div style={{ fontSize: 12, color: s.textMuted }}>
                  {proj && <span style={{ color: proj.color, fontWeight: 600 }}>● {proj.title} </span>}
                  {t.due_date && <span style={{ color: overdue ? "#FF6B6B" : s.textMuted }}>{overdue ? "⚠ Overdue · " : "· Due "}{formatDate(t.due_date)}</span>}
                </div>
              </div>
              <div style={s.badge(STATUS_CONFIG[t.status] || STATUS_CONFIG["To Do"])}>{t.status}</div>
              <div style={{ ...s.priorityDot(PRIORITY_CONFIG[t.priority]?.dot || "#888"), marginLeft: 4 }} />
              <button onClick={e => { e.stopPropagation(); deleteTask(t.id); }} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 16, opacity: 0.5, padding: "0 4px" }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════ PROJECTS ═══════════════
function ProjectsPage({ s, projects, tasks, openProject, deleteProject }) {
  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {projects.map((p, i) => {
        const done = p.completedCount ?? 0, total = p.taskCount ?? 0;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return (
          <div key={p.id} className="proj-card" style={{ ...s.projCard(p.color), animation: "cardEnter 0.4s ease-out both", animationDelay: `${i * 80}ms` }}
            onClick={() => openProject(p.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: s.textMuted, marginBottom: 16 }}>{total} task{total !== 1 ? "s" : ""} · {pct}% done</div>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 14, opacity: 0.4 }}>✕</button>
            </div>
            <div style={{ height: 6, background: s.trackBg, borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: 99, transition: "width 0.6s" }} />
            </div>
            <div style={{ fontSize: 12, color: s.textMuted }}>{done}/{total} completed</div>
          </div>
        );
      })}
      {projects.length === 0 && <div style={{ color: "#5050A0", fontSize: 14 }}>No projects yet. Create one! 🚀</div>}
    </div>
  );
}

// ═══════════════ MODALS ═══════════════
function TaskDetailModal({ s, task, projects, api, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task, projectId: task.projectId || task.project_id });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const proj = projects.find(p => p.id === (task.projectId || task.project_id));

  useEffect(() => {
    api(`/tasks/${task.id}/comments`).then(setComments).catch(() => { });
  }, [task.id]);

  async function addComment() {
    if (!newComment.trim()) return;
    try {
      const c = await api(`/tasks/${task.id}/comments`, { method: "POST", body: JSON.stringify({ comment: newComment }) });
      setComments(prev => [c, ...prev]);
      setNewComment("");
    } catch (e) { alert(e.message); }
  }

  return (
    <div className="modal-backdrop" style={s.modal} onClick={onClose}>
      <div className="modal-content" style={{ ...s.modalBox, minWidth: 440, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>Task Detail</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 16, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {!editing ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{task.title}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={s.badge(STATUS_CONFIG[task.status])}>{task.status}</span>
              <span style={s.badge({ bg: (PRIORITY_CONFIG[task.priority]?.color || "#888") + "22", text: PRIORITY_CONFIG[task.priority]?.color || "#888" })}>{task.priority} Priority</span>
              {proj && <span style={s.badge({ bg: proj.color + "22", text: proj.color })}>● {proj.title}</span>}
            </div>
            {task.description && <div style={{ fontSize: 14, color: "#A0A0C0", lineHeight: 1.7, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14 }}>{task.description}</div>}
            {task.due_date && <div style={{ fontSize: 13, color: isOverdue(task.due_date) ? "#FF6B6B" : "#7070A0", marginBottom: 8 }}>{isOverdue(task.due_date) ? "⚠ Overdue: " : "📅 Due: "}{formatDate(task.due_date)}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-primary" style={s.btn("primary")} onClick={() => setEditing(true)}>Edit</button>
              <button style={s.btn("secondary")} onClick={() => onUpdate({ ...task, projectId: task.projectId || task.project_id, status: task.status === "Done" ? "To Do" : "Done" })}>
                {task.status === "Done" ? "Mark Incomplete" : "✓ Mark Done"}
              </button>
              <button style={{ ...s.btn("danger"), marginLeft: "auto" }} onClick={() => { onDelete(task.id); onClose(); }}>Delete</button>
            </div>
            {/* Comments Section */}
            <div style={{ marginTop: 24, borderTop: "1px solid #1E1E2E", paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#7070A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>💬 Comments</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="input-glow" style={{ ...s.input, flex: 1, padding: "9px 12px", fontSize: 13 }} placeholder="Add a comment..." value={newComment}
                  onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()} />
                <button className="btn-primary" style={{ ...s.btn("primary"), padding: "9px 16px", fontSize: 12 }} onClick={addComment}>Send</button>
              </div>
              <div style={{ maxHeight: 180, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {comments.map(c => (
                  <div key={c.id} className="fade-in" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#A89FF7" }}>{c.user_name}</span>
                      <span style={{ fontSize: 10, color: "#5050A0" }}>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#C0C0D0", lineHeight: 1.5 }}>{c.comment}</div>
                  </div>
                ))}
                {comments.length === 0 && <div style={{ fontSize: 12, color: "#5050A0", textAlign: "center", padding: 12 }}>No comments yet</div>}
              </div>
            </div>
          </>
        ) : (
          <EditTaskForm form={form} setForm={setForm} projects={projects} s={s}
            onSave={() => { onUpdate(form); setEditing(false); }} onCancel={() => setEditing(false)} />
        )}
      </div>
    </div>
  );
}

function EditTaskForm({ form, setForm, projects, s, onSave, onCancel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><label style={s.label}>Title</label>
        <input className="input-glow" style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
      <div><label style={s.label}>Description</label>
        <textarea className="input-glow" style={{ ...s.input, minHeight: 80, resize: "vertical" }} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={s.label}>Status</label>
          <select style={s.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label style={s.label}>Priority</label>
          <select style={s.select} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            {["High", "Medium", "Low"].map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
      <div><label style={s.label}>Due Date</label>
        <input className="input-glow" type="date" style={s.input} value={form.due_date ? form.due_date.slice(0, 10) : ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
      <div><label style={s.label}>Project</label>
        <select style={s.select} value={form.projectId || form.project_id} onChange={e => setForm(f => ({ ...f, projectId: Number(e.target.value) }))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn-primary" style={s.btn("primary")} onClick={onSave}>Save Changes</button>
        <button style={s.btn("secondary")} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NewTaskModal({ s, projects, defaultProjectId, onClose, onSave, loading }) {
  const [form, setForm] = useState({ title: "", description: "", status: "To Do", priority: "Medium", due_date: "", projectId: defaultProjectId || projects[0]?.id });
  return (
    <div className="modal-backdrop" style={s.modal} onClick={onClose}>
      <div className="modal-content" style={s.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>New Task ✨</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 16, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <EditTaskForm form={form} setForm={setForm} projects={projects} s={s}
          onSave={() => { if (form.title.trim()) onSave(form); }} onCancel={onClose} />
        {loading && <div style={{ color: "#6C63FF", fontSize: 13, marginTop: 8 }}>Saving…</div>}
      </div>
    </div>
  );
}

function NewProjectModal({ s, onClose, onSave }) {
  const colors = ["#6C63FF", "#FF6B6B", "#43D9AD", "#FFD166", "#60A5FA", "#F472B6", "#A78BFA", "#F97316"];
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(colors[0]);
  return (
    <div className="modal-backdrop" style={s.modal} onClick={onClose}>
      <div className="modal-content" style={{ ...s.modalBox, width: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>New Project 🗂️</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 16, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Project Name</label>
          <input className="input-glow" style={s.input} placeholder="e.g. Website Redesign" value={title}
            onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && title.trim() && onSave({ title, color })} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={s.label}>Color</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            {colors.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", outline: color === c ? `3px solid ${c}` : "3px solid transparent", outlineOffset: 3, transition: "transform 0.15s, outline 0.15s", transform: color === c ? "scale(1.15)" : "scale(1)" }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" style={s.btn("primary")} onClick={() => { if (title.trim()) onSave({ title, color }); }}>Create Project</button>
          <button style={s.btn("secondary")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════ LOG PAGE (SQL Terminal Viewer) ═══════════════
function LogPage({ s, api }) {
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("tables");
  const [loadingTable, setLoadingTable] = useState(false);

  useEffect(() => {
    api("/tables").then(t => { setTables(t); if (t.length) { setActiveTable(t[0]); } }).catch(() => { });
    api("/logs").then(setLogs).catch(() => { });
  }, []);

  useEffect(() => {
    if (!activeTable) return;
    setLoadingTable(true);
    api(`/tables/${activeTable}`).then(setTableData).catch(() => setTableData(null)).finally(() => setLoadingTable(false));
  }, [activeTable]);

  function fmtVal(v) {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "object" && v instanceof Date) return v.toISOString().slice(0, 19);
    if (typeof v === "object") try { return new Date(v).toISOString().slice(0, 19); } catch { return String(v); }
    return String(v);
  }

  function renderSQLTable() {
    if (!tableData || !tableData.columns) return null;
    const cols = tableData.columns.map(c => c.field);
    const colWidths = cols.map(col => {
      let max = col.length;
      tableData.rows.forEach(row => { const len = fmtVal(row[col]).length; if (len > max) max = len; });
      return Math.min(max, 30);
    });
    const border = "+" + colWidths.map(w => "-".repeat(w + 2)).join("+") + "+";
    const header = "|" + cols.map((col, i) => ` ${col.padEnd(colWidths[i])} `).join("|") + "|";
    const rows = tableData.rows.map(row =>
      "|" + cols.map((col, i) => {
        const val = fmtVal(row[col]);
        return ` ${val.slice(0, colWidths[i]).padEnd(colWidths[i])} `;
      }).join("|") + "|"
    );
    return [border, header, border, ...rows, border].join("\n");
  }

  const termStyle = {
    background: "#0a0a0f", border: "1px solid #1E1E2E", borderRadius: 12,
    fontFamily: "'Courier New', 'Consolas', monospace", fontSize: 12.5, color: "#43D9AD",
    padding: 0, overflow: "hidden",
  };

  return (
    <div className="fade-in">
      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className="view-toggle-btn" onClick={() => setTab("tables")}
          style={{ padding: "9px 20px", borderRadius: 20, border: "none", cursor: "pointer", background: tab === "tables" ? "linear-gradient(135deg,#6C63FF,#9B88FF)" : "rgba(255,255,255,0.05)", color: tab === "tables" ? "#fff" : "#7070A0", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
          📊 Database Tables
        </button>
        <button className="view-toggle-btn" onClick={() => setTab("activity")}
          style={{ padding: "9px 20px", borderRadius: 20, border: "none", cursor: "pointer", background: tab === "activity" ? "linear-gradient(135deg,#6C63FF,#9B88FF)" : "rgba(255,255,255,0.05)", color: tab === "activity" ? "#fff" : "#7070A0", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
          📝 Activity Log
        </button>
      </div>

      {tab === "tables" && (
        <>
          {/* Table Selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {tables.map(t => (
              <button key={t} className="view-toggle-btn" onClick={() => setActiveTable(t)}
                style={{ padding: "7px 16px", borderRadius: 10, border: activeTable === t ? "1px solid #6C63FF" : "1px solid #1E1E2E", cursor: "pointer", background: activeTable === t ? "rgba(108,99,255,0.15)" : "rgba(255,255,255,0.03)", color: activeTable === t ? "#A89FF7" : "#7070A0", fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 600 }}>
                {t}
              </button>
            ))}
          </div>

          {/* SQL Terminal */}
          {activeTable && (
            <div style={termStyle}>
              {/* Terminal Header */}
              <div style={{ background: "#111118", padding: "10px 16px", borderBottom: "1px solid #1E1E2E", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF6B6B" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFD166" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#43D9AD" }} />
                <span style={{ fontSize: 12, color: "#5050A0", marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>mysql — taskflow database</span>
              </div>
              <div style={{ padding: 16, overflow: "auto", maxHeight: "60vh" }}>
                <div style={{ color: "#7070A0", marginBottom: 6 }}>mysql&gt; <span style={{ color: "#60A5FA" }}>SELECT</span> * <span style={{ color: "#60A5FA" }}>FROM</span> <span style={{ color: "#FFD166" }}>{activeTable}</span> <span style={{ color: "#60A5FA" }}>ORDER BY</span> id <span style={{ color: "#60A5FA" }}>DESC</span> <span style={{ color: "#60A5FA" }}>LIMIT</span> 100;</div>
                {loadingTable ? (
                  <div style={{ color: "#5050A0", padding: 20 }}>Loading...</div>
                ) : tableData ? (
                  <>
                    <pre style={{ margin: 0, whiteSpace: "pre", color: "#E8E8F0", lineHeight: 1.6, fontSize: 12 }}>{renderSQLTable()}</pre>
                    <div style={{ color: "#7070A0", marginTop: 8 }}>{tableData.rows.length} row{tableData.rows.length !== 1 ? "s" : ""} in set</div>
                    {/* Column Schema */}
                    <div style={{ marginTop: 16, color: "#7070A0" }}>mysql&gt; <span style={{ color: "#60A5FA" }}>DESCRIBE</span> <span style={{ color: "#FFD166" }}>{activeTable}</span>;</div>
                    <div style={{ marginTop: 8 }}>
                      {tableData.columns.map(c => (
                        <div key={c.field} style={{ display: "flex", gap: 16, fontSize: 12, padding: "2px 0" }}>
                          <span style={{ color: "#E8E8F0", minWidth: 120 }}>{c.field}</span>
                          <span style={{ color: "#9B88FF", minWidth: 140 }}>{c.type}</span>
                          <span style={{ color: c.key === "PRI" ? "#FFD166" : c.key === "MUL" ? "#43D9AD" : "#5050A0" }}>{c.key === "PRI" ? "PRIMARY KEY" : c.key === "MUL" ? "FOREIGN KEY" : c.nullable === "YES" ? "NULLABLE" : ""}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#FF6B6B" }}>Error loading table data</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "activity" && (
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#7070A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>📝 Activity Timeline</div>
          {logs.length === 0 && <div style={{ color: "#5050A0", textAlign: "center", padding: 24 }}>No activity yet. Start creating tasks and projects!</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {logs.map((log, i) => {
              const actionColors = { CREATE: "#43D9AD", UPDATE: "#FFD166", DELETE: "#FF6B6B", COMMENT: "#60A5FA" };
              const actionIcons = { CREATE: "➕", UPDATE: "✏️", DELETE: "🗑️", COMMENT: "💬" };
              return (
                <div key={log.id} className="task-row-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, borderBottom: "1px solid #1A1A28", animation: "fadeIn 0.3s ease-out both", animationDelay: `${i * 30}ms` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: (actionColors[log.action] || "#888") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {actionIcons[log.action] || "📋"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: actionColors[log.action] || "#888" }}>{log.action}</span>
                      <span style={{ color: "#7070A0" }}> · {log.entity_type}</span>
                    </div>
                    {log.details && <div style={{ fontSize: 12, color: "#5050A0", marginTop: 2 }}>{log.details}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#5050A0", whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════ REPORTS / EXPORT PAGE ═══════════════
function ReportsPage({ s, api }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterProject, setFilterProject] = useState("All");
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    (async () => { try { setLoading(true); const r = await api("/export/report-data"); setReport(r); } catch(e){console.error(e);} finally{setLoading(false);} })();
  }, []);

  if (loading) return <div style={{ color: s.textMuted, padding: 40, textAlign: "center" }}>Loading report data…</div>;
  if (!report) return <div style={{ color: "#FF6B6B", padding: 40 }}>Failed to load report data</div>;

  const { tasks, projects, statusBreakdown, priorityBreakdown, overdueCount, recentActivity, generatedAt } = report;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "Done").length;
  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Filter tasks for preview table
  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== "All" && t.status !== filterStatus) return false;
    if (filterPriority !== "All" && t.priority !== filterPriority) return false;
    if (filterProject !== "All" && t.project_id !== Number(filterProject)) return false;
    return true;
  });

  // CSV Download
  async function downloadCSV() {
    setExporting("csv");
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "All") params.set("status", filterStatus);
      if (filterPriority !== "All") params.set("priority", filterPriority);
      if (filterProject !== "All") params.set("project", filterProject);
      const token = localStorage.getItem("taskflow_token");
      const resp = await fetch(`/api/export/csv?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `taskflow_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { alert("CSV export failed: " + e.message); }
    setExporting(null);
  }

  // PDF Download (client-side generation)
  async function downloadPDF() {
    setExporting("pdf");
    try {
      // Dynamically load jsPDF
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const sc = document.createElement("script");
          sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          sc.onload = resolve; sc.onerror = reject; document.head.appendChild(sc);
        });
        await new Promise((resolve, reject) => {
          const sc = document.createElement("script");
          sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
          sc.onload = resolve; sc.onerror = reject; document.head.appendChild(sc);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("landscape", "mm", "a4");
      const pw = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(108, 99, 255);
      doc.rect(0, 0, pw, 28, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
      doc.text("TaskFlow Report", 14, 16);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

      // Summary row
      doc.setTextColor(50, 50, 50); doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, 38);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const summaryItems = [
        `Total Tasks: ${totalTasks}`, `Completed: ${doneTasks} (${completionRate}%)`,
        `Overdue: ${overdueCount}`, `Projects: ${projects.length}`
      ];
      doc.text(summaryItems.join("    |    "), 14, 45);

      // Status Breakdown
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Status Breakdown", 14, 55);
      const statusData = statusBreakdown.map(s => [s.status, String(s.count), totalTasks ? `${Math.round((s.count/totalTasks)*100)}%` : "0%"]);
      doc.autoTable({ startY: 58, head: [["Status", "Count", "Percentage"]], body: statusData, theme: "grid",
        headStyles: { fillColor: [108, 99, 255], textColor: [255,255,255] },
        styles: { fontSize: 9 }, margin: { left: 14 }, tableWidth: 100 });

      // Priority Breakdown
      const prY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Priority Breakdown", 14, prY);
      const prData = priorityBreakdown.map(p => [p.priority, String(p.count)]);
      doc.autoTable({ startY: prY + 3, head: [["Priority", "Count"]], body: prData, theme: "grid",
        headStyles: { fillColor: [108, 99, 255] }, styles: { fontSize: 9 }, margin: { left: 14 }, tableWidth: 80 });

      // Projects table
      if (projects.length > 0) {
        const pjY = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("Project Summary", 14, pjY);
        const projData = projects.map(p => [p.title, String(p.task_count || 0), String(p.done_count || 0),
          p.task_count ? `${Math.round(((p.done_count || 0) / p.task_count) * 100)}%` : "0%"]);
        doc.autoTable({ startY: pjY + 3, head: [["Project", "Tasks", "Done", "Progress"]], body: projData, theme: "grid",
          headStyles: { fillColor: [108, 99, 255] }, styles: { fontSize: 9 }, margin: { left: 14 }, tableWidth: 160 });
      }

      // Full task table on new page
      doc.addPage();
      doc.setFillColor(108, 99, 255);
      doc.rect(0, 0, pw, 20, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
      doc.text("All Tasks Detail", 14, 14);

      const taskData = filteredTasks.map(t => [
        String(t.id), t.title, t.status, t.priority,
        t.project_name || "None",
        t.due_date ? new Date(t.due_date).toLocaleDateString() : "—",
        new Date(t.created_at).toLocaleDateString()
      ]);
      doc.autoTable({
        startY: 26,
        head: [["ID", "Title", "Status", "Priority", "Project", "Due Date", "Created"]],
        body: taskData,
        theme: "striped",
        headStyles: { fillColor: [108, 99, 255], textColor: [255,255,255] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 1: { cellWidth: 70 } },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
        doc.text(`TaskFlow Report — Page ${i} of ${pages}`, pw/2, doc.internal.pageSize.getHeight()-8, {align:"center"});
      }

      doc.save(`taskflow_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) { alert("PDF export failed: " + e.message); console.error(e); }
    setExporting(null);
  }

  // UI Helpers
  const statCards = [
    { label: "Total Tasks", val: totalTasks, icon: "📊", color: s.accent.primary },
    { label: "Completed", val: `${doneTasks} (${completionRate}%)`, icon: "✅", color: "#43D9AD" },
    { label: "Overdue", val: overdueCount, icon: "⚠️", color: "#FF6B6B" },
    { label: "Projects", val: projects.length, icon: "📁", color: "#FFD166" },
  ];
  const maxCount = Math.max(1, ...statusBreakdown.map(sb => sb.count));
  const maxPriCount = Math.max(1, ...priorityBreakdown.map(pb => pb.count));
  const statusColors = { "To Do": "#6C63FF", "In Progress": "#FFD166", "Done": "#43D9AD" };
  const priColors = { "High": "#FF6B6B", "Medium": "#FFD166", "Low": "#43D9AD" };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header with export buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: s.textMuted, fontWeight: 600 }}>Report generated: {new Date(generatedAt).toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" onClick={downloadCSV} disabled={exporting === "csv"}
            style={{ ...s.btn("primary"), display: "flex", alignItems: "center", gap: 8, opacity: exporting === "csv" ? 0.6 : 1 }}>
            {exporting === "csv" ? "⏳ Exporting..." : "📄 Export CSV"}
          </button>
          <button className="btn-primary" onClick={downloadPDF} disabled={exporting === "pdf"}
            style={{ ...s.btn("primary"), background: `linear-gradient(135deg, #FF6B6B, #FF8E8E)`, display: "flex", alignItems: "center", gap: 8, opacity: exporting === "pdf" ? 0.6 : 1 }}>
            {exporting === "pdf" ? "⏳ Generating..." : "📕 Export PDF"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {statCards.map((st, i) => (
          <div key={st.label} className="stat-card" style={{ ...s.statCard(st.color), animationDelay: `${i*80}ms`, animation: "cardEnter 0.4s ease-out both", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, fontSize: 60, opacity: 0.06 }}>{st.icon}</div>
            <div style={{ fontSize: 12, color: s.textMuted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{st.label}</div>
            <div style={{ ...s.statNum, color: st.color }}>{st.val}</div>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Status Breakdown */}
        <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.3s" }}>
          <div style={s.sectionTitle}>📊 Status breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {statusBreakdown.map(sb => (
              <div key={sb.status}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  <span>{sb.status}</span>
                  <span style={{ color: s.textMuted }}>{sb.count} task{sb.count!==1?"s":""} ({totalTasks?Math.round((sb.count/totalTasks)*100):0}%)</span>
                </div>
                <div style={{ height: 8, background: s.trackBg, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(sb.count/maxCount)*100}%`, height: "100%", background: statusColors[sb.status] || s.accent.primary, borderRadius: 99, transition: "width 0.8s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.4s" }}>
          <div style={s.sectionTitle}>🔥 Priority breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {priorityBreakdown.map(pb => (
              <div key={pb.priority}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  <span>{pb.priority}</span>
                  <span style={{ color: s.textMuted }}>{pb.count} task{pb.count!==1?"s":""}</span>
                </div>
                <div style={{ height: 8, background: s.trackBg, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(pb.count/maxPriCount)*100}%`, height: "100%", background: priColors[pb.priority] || "#888", borderRadius: 99, transition: "width 0.8s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Completion */}
      {projects.length > 0 && (
        <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.5s" }}>
          <div style={s.sectionTitle}>🗂️ Project completion</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Project", "Tasks", "Done", "Progress", "Completion"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `2px solid ${s.border}`, color: s.textMuted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const pct = p.task_count ? Math.round(((p.done_count||0)/p.task_count)*100) : 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${s.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}><span style={{ color: p.color }}>●</span> {p.title}</td>
                      <td style={{ padding: "10px 12px", color: s.textMuted }}>{p.task_count || 0}</td>
                      <td style={{ padding: "10px 12px", color: "#43D9AD", fontWeight: 600 }}>{p.done_count || 0}</td>
                      <td style={{ padding: "10px 12px", width: 200 }}>
                        <div style={{ height: 6, background: s.trackBg, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: 99 }} />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: pct === 100 ? "#43D9AD" : s.accent.primary }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters + Task Table */}
      <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.6s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={s.sectionTitle}>📋 Task data preview ({filteredTasks.length} tasks)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...s.select, width: "auto", padding: "6px 10px", fontSize: 12 }}>
              <option value="All">All Status</option><option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...s.select, width: "auto", padding: "6px 10px", fontSize: 12 }}>
              <option value="All">All Priority</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
            </select>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...s.select, width: "auto", padding: "6px 10px", fontSize: 12 }}>
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX: "auto", maxHeight: 400 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["#", "Title", "Description", "Status", "Priority", "Project", "Due Date", "Created"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${s.border}`, color: s.textMuted, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", position: "sticky", top: 0, background: s.isDark ? "#13131C" : "#fff", zIndex: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t, i) => (
                <tr key={t.id} className="task-row-hover" style={{ borderBottom: `1px solid ${s.border}`, animation: "fadeIn 0.2s ease-out both", animationDelay: `${i*20}ms` }}>
                  <td style={{ padding: "8px 10px", color: s.textMuted, fontWeight: 600 }}>{t.id}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                  <td style={{ padding: "8px 10px", color: s.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "—"}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: (statusColors[t.status]||"#888")+"22", color: statusColors[t.status]||"#888" }}>{t.status}</span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: (priColors[t.priority]||"#888")+"22", color: priColors[t.priority]||"#888" }}>{t.priority}</span>
                  </td>
                  <td style={{ padding: "8px 10px", color: s.textMuted, whiteSpace: "nowrap" }}>{t.project_name || "—"}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "8px 10px", color: s.textMuted, whiteSpace: "nowrap" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: s.textMuted }}>No tasks match the selected filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div style={{ ...s.card, animation: "cardEnter 0.4s ease-out both", animationDelay: "0.7s" }}>
          <div style={s.sectionTitle}>🕐 Recent activity</div>
          {recentActivity.map((log, i) => {
            const actionColors = { CREATE: "#43D9AD", UPDATE: "#FFD166", DELETE: "#FF6B6B", COMMENT: "#60A5FA" };
            return (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${s.border}`, animation: "fadeIn 0.2s ease-out both", animationDelay: `${i*30}ms` }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: (actionColors[log.action]||"#888")+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink:0 }}>
                  {log.action === "CREATE" ? "➕" : log.action === "UPDATE" ? "✏️" : log.action === "DELETE" ? "🗑️" : "💬"}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: actionColors[log.action] }}>{log.action}</span>
                  <span style={{ fontSize: 12, color: s.textMuted }}> · {log.entity_type}</span>
                  {log.details && <span style={{ fontSize: 11, color: s.textMuted }}> — {log.details}</span>}
                </div>
                <div style={{ fontSize: 11, color: s.textMuted, whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════ SETTINGS PAGE ═══════════════
function SettingsPage({ s, user, token, api, theme, toggleTheme, accent, changeAccent, updateUser, onLogout }) {
  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true); setMsg(null);
    try {
      const data = await api("/auth/profile", { method: "PUT", body: JSON.stringify(profileForm) });
      updateUser(data.token, data.user);
      setMsg({ type: "success", text: "Profile updated successfully! ✨" });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ type: "error", text: "Passwords don't match" }); return; }
    if (pwForm.newPassword.length < 4) { setPwMsg({ type: "error", text: "Password must be at least 4 characters" }); return; }
    try {
      await api("/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      setPwMsg({ type: "success", text: "Password changed successfully! 🔒" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) { setPwMsg({ type: "error", text: e.message }); }
  }

  const msgStyle = (type) => ({
    padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 500, marginBottom: 16,
    background: type === "success" ? "rgba(67,217,173,0.12)" : "rgba(255,107,107,0.12)",
    border: `1px solid ${type === "success" ? "rgba(67,217,173,0.3)" : "rgba(255,107,107,0.3)"}`,
    color: type === "success" ? "#43D9AD" : "#FF6B6B",
  });

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Profile Section */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#6C63FF,#9B88FF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700 }}>{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>Profile Settings</div>
            <div style={{ fontSize: 13, color: "#7070A0" }}>Update your personal information</div>
          </div>
        </div>
        {msg && <div className="fade-in" style={msgStyle(msg.type)}>{msg.text}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div><label style={s.label}>Full Name</label>
            <input className="input-glow" style={s.input} value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={s.label}>Email Address</label>
            <input className="input-glow" style={s.input} type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} /></div>
        </div>
        <button className="btn-primary" style={{ ...s.btn("primary"), opacity: saving ? 0.7 : 1 }} onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* Security Section */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>🔒 Security</div>
          <div style={{ fontSize: 13, color: "#7070A0" }}>Change your password</div>
        </div>
        {pwMsg && <div className="fade-in" style={msgStyle(pwMsg.type)}>{pwMsg.text}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          <div><label style={s.label}>Current Password</label>
            <input className="input-glow" style={s.input} type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={s.label}>New Password</label>
              <input className="input-glow" style={s.input} type="password" placeholder="••••••••" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} /></div>
            <div><label style={s.label}>Confirm New Password</label>
              <input className="input-glow" style={s.input} type="password" placeholder="••••••••" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} /></div>
          </div>
        </div>
        <button className="btn-primary" style={s.btn("primary")} onClick={changePassword}>Update Password</button>
      </div>

      {/* Appearance Section */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>🎨 Appearance</div>
          <div style={{ fontSize: 13, color: "#7070A0" }}>Customize your workspace look</div>
        </div>
        {/* Theme Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid " + (theme === "dark" ? "#1E1E2E" : "#E0E0E4"), marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</div>
            <div style={{ fontSize: 12, color: "#7070A0" }}>Switch between dark and light themes</div>
          </div>
          <div onClick={toggleTheme} style={{ width: 52, height: 28, borderRadius: 99, background: theme === "dark" ? "linear-gradient(135deg,#6C63FF,#9B88FF)" : "#ccc", cursor: "pointer", position: "relative", transition: "background 0.3s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: theme === "dark" ? 27 : 3, transition: "left 0.3s cubic-bezier(.4,0,.2,1)", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
        {/* Color Theme Presets */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#7070A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"} Color Themes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { id: "purple", name: "Purple", primary: "#6C63FF", secondary: "#9B88FF" },
            { id: "blue",   name: "Ocean",  primary: "#3B82F6", secondary: "#60A5FA" },
            { id: "green",  name: "Emerald", primary: "#10B981", secondary: "#34D399" },
            { id: "rose",   name: "Rose",   primary: "#F43F5E", secondary: "#FB7185" },
            { id: "amber",  name: "Amber",  primary: "#F59E0B", secondary: "#FBBF24" },
            { id: "cyan",   name: "Cyan",   primary: "#06B6D4", secondary: "#22D3EE" },
          ].map(t => (
            <div key={t.id} onClick={() => changeAccent(t.id)}
              style={{ padding: "14px 16px", borderRadius: 14, cursor: "pointer", border: accent === t.id ? `2px solid ${t.primary}` : "2px solid " + (theme === "dark" ? "#1E1E2E" : "#E0E0E4"), background: accent === t.id ? (t.primary + "18") : (theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"), transition: "all 0.2s", transform: accent === t.id ? "scale(1.03)" : "scale(1)" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }} />
                <div style={{ width: 20, height: 20, borderRadius: 6, background: theme === "dark" ? "#1c1c2c" : "#f0f0f4" }} />
                <div style={{ width: 20, height: 20, borderRadius: 6, background: theme === "dark" ? "#0e0e14" : "#ffffff" }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</div>
              {accent === t.id && <div style={{ fontSize: 10, color: t.primary, marginTop: 2 }}>✓ Active</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...s.card, borderColor: "rgba(255,107,107,0.2)" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#FF6B6B", marginBottom: 4 }}>⚠ Danger Zone</div>
          <div style={{ fontSize: 13, color: "#7070A0" }}>Careful — these actions cannot be undone</div>
        </div>
        <button style={{ ...s.btn("danger"), padding: "10px 20px" }} onClick={() => { if (window.confirm("Are you sure you want to logout?")) onLogout(); }}>Sign Out of Account</button>
      </div>
    </div>
  );
}

// ═══════════════ STYLES ═══════════════
const ACCENT_MAP = {
  purple: { primary: "#6C63FF", secondary: "#9B88FF", activeText: "#A89FF7", activeBg: "rgba(108,99,255,0.18)" },
  blue:   { primary: "#3B82F6", secondary: "#60A5FA", activeText: "#60A5FA", activeBg: "rgba(59,130,246,0.18)" },
  green:  { primary: "#10B981", secondary: "#34D399", activeText: "#34D399", activeBg: "rgba(16,185,129,0.18)" },
  rose:   { primary: "#F43F5E", secondary: "#FB7185", activeText: "#FB7185", activeBg: "rgba(244,63,94,0.18)" },
  amber:  { primary: "#F59E0B", secondary: "#FBBF24", activeText: "#FBBF24", activeBg: "rgba(245,158,11,0.18)" },
  cyan:   { primary: "#06B6D4", secondary: "#22D3EE", activeText: "#22D3EE", activeBg: "rgba(6,182,212,0.18)" },
};

function makeStyles(sidebarOpen, theme = "dark", accent = "purple") {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.purple;
  const dk = theme === "dark";
  const c = {
    bg: dk ? "#0E0E14" : "#F4F4F8",
    sidebarBg: dk ? "rgba(19,19,28,0.95)" : "rgba(255,255,255,0.95)",
    border: dk ? "#1E1E2E" : "#E0E0E8",
    cardBg: dk ? "rgba(19,19,28,0.8)" : "rgba(255,255,255,0.85)",
    topbarBg: dk ? "rgba(14,14,20,0.9)" : "rgba(244,244,248,0.9)",
    text: dk ? "#E8E8F0" : "#1A1A2E",
    textMuted: dk ? "#7070A0" : "#6B6B80",
    inputBg: dk ? "#0E0E14" : "#FFFFFF",
    inputBorder: dk ? "#1E1E2E" : "#D0D0D8",
    hoverBg: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    rowBorder: dk ? "#1A1A28" : "#EBEBF0",
    modalBg: dk ? "rgba(19,19,28,0.95)" : "rgba(255,255,255,0.97)",
    modalOverlay: dk ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.35)",
  };
  return {
    isDark: dk,
    accent: a,
    text: c.text,
    textMuted: c.textMuted,
    border: c.border,
    trackBg: dk ? "#1E1E2E" : "#E0E0E8",
    colBg: dk ? "rgba(19,19,28,0.6)" : "rgba(240,240,248,0.85)",
    cardSolid: dk ? "#13131C" : "#FFFFFF",
    root: { display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: c.bg, color: c.text, overflow: "hidden", transition: "background 0.3s, color 0.3s" },
    sidebar: { width: sidebarOpen ? 250 : 68, background: c.sidebarBg, backdropFilter: "blur(12px)", borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column", transition: "width 0.3s cubic-bezier(.4,0,.2,1), background 0.3s", overflow: "hidden", flexShrink: 0 },
    sidebarTop: { padding: sidebarOpen ? "20px 16px 14px" : "16px 8px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${c.border}`, minHeight: 64 },
    logo: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: a.primary, whiteSpace: "nowrap", overflow: "hidden", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s, color 0.3s" },
    logoIcon: { width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${a.primary},${a.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 800, color: "#fff" },
    navItem: (active) => ({ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: 12, cursor: "pointer", background: active ? a.activeBg : "transparent", color: active ? a.activeText : c.textMuted, fontWeight: active ? 600 : 400, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", marginBottom: 3, transition: "background 0.2s, color 0.2s" }),
    navIcon: { fontSize: 18, flexShrink: 0 },
    main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    topbar: { padding: "18px 28px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 16, background: c.topbarBg, backdropFilter: "blur(8px)", transition: "background 0.3s" },
    pageTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, flex: 1, letterSpacing: "-0.5px" },
    btn: (v = "primary") => ({ padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, background: v === "primary" ? `linear-gradient(135deg,${a.primary},${a.secondary})` : v === "danger" ? "rgba(255,107,107,0.15)" : c.hoverBg, color: v === "primary" ? "#fff" : v === "danger" ? "#FF6B6B" : c.textMuted, transition: "background 0.2s" }),
    content: { flex: 1, overflow: "auto", padding: 28 },
    card: { background: c.cardBg, backdropFilter: "blur(8px)", border: `1px solid ${c.border}`, borderRadius: 18, padding: 22, transition: "background 0.3s, border 0.3s" },
    statCard: (color) => ({ background: c.cardBg, backdropFilter: "blur(8px)", border: `1px solid ${color}22`, borderRadius: 18, padding: "22px 24px", borderTop: `3px solid ${color}`, transition: "background 0.3s" }),
    statNum: { fontSize: 36, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" },
    statLabel: { fontSize: 13, color: c.textMuted, marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: c.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 },
    taskRow: (hovered) => ({ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12, cursor: "pointer", background: "transparent", borderBottom: `1px solid ${c.rowBorder}` }),
    badge: (config) => ({ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: config?.bg || (dk ? "#222" : "#eee"), color: config?.text || (dk ? "#888" : "#555"), whiteSpace: "nowrap" }),
    priorityDot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),
    projCard: (color) => ({ background: c.cardBg, backdropFilter: "blur(8px)", border: `1px solid ${c.border}`, borderRadius: 18, padding: 22, cursor: "pointer", borderTop: `3px solid ${color}`, transition: "background 0.3s" }),
    input: { width: "100%", background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 12, padding: "11px 14px", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s, background 0.3s" },
    select: { width: "100%", background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 12, padding: "11px 14px", color: c.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box", appearance: "none", cursor: "pointer", transition: "background 0.3s" },
    label: { fontSize: 12, color: c.textMuted, marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: "0.03em" },
    modal: { position: "fixed", inset: 0, background: c.modalOverlay, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modalBox: { background: c.modalBg, backdropFilter: "blur(16px)", border: `1px solid ${a.primary}25`, borderRadius: 24, padding: 32, width: 500, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", boxShadow: dk ? "0 32px 64px rgba(0,0,0,0.5)" : "0 32px 64px rgba(0,0,0,0.12)" },
  };
}
