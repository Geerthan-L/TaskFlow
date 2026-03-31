import { useState, useEffect, useCallback, useRef } from "react";

// ── Config ────────────────────────────────────────────────────
const API = "http://localhost:5000/api";

// ── API helper ────────────────────────────────────────────────
async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const PRIORITY_CONFIG = {
  High:   { color: "#FF6B6B", dot: "#FF6B6B" },
  Medium: { color: "#FFD166", dot: "#FFD166" },
  Low:    { color: "#43D9AD", dot: "#43D9AD" },
};
const STATUS_CONFIG = {
  "To Do":       { bg: "rgba(108,99,255,0.15)", text: "#A89FF7" },
  "In Progress": { bg: "rgba(255,209,102,0.15)", text: "#FFD166" },
  "Done":        { bg: "rgba(67,217,173,0.15)",  text: "#43D9AD" },
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ════════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════════
export default function Root() {
  const [token, setToken] = useState(() => localStorage.getItem("tf_token"));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("tf_user")); } catch { return null; }
  });

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

  if (!token || !user) return <AuthPage onLogin={onLogin} />;
  return <TaskFlow token={token} user={user} onLogout={onLogout} />;
}

// ════════════════════════════════════════════════════════════
//  AUTH PAGE
// ════════════════════════════════════════════════════════════
function AuthPage({ onLogin }) {
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const s = makeStyles(true);

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

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#0E0E14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: "#13131C", border: "1px solid #1E1E2E", borderRadius: 20, padding: 36, width: 380, maxWidth: "90vw" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6C63FF,#9B88FF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>TF</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "#6C63FF" }}>TaskFlow</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: "#E8E8F0", marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </div>
          <div style={{ fontSize: 13, color: "#7070A0", marginBottom: 24 }}>
            {mode === "login" ? "Sign in to your workspace" : "Start managing your tasks"}
          </div>
          {error && <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 10, padding: "10px 14px", color: "#FF6B6B", fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <div><label style={s.label}>Name</label>
                <input style={s.input} placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            )}
            <div><label style={s.label}>Email</label>
              <input style={s.input} placeholder="you@example.com" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label style={s.label}>Password</label>
              <input style={s.input} placeholder="••••••••" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submit()} /></div>
            <button onClick={submit} disabled={loading} style={{ ...s.btn("primary"), marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#7070A0" }}>
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

// ════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════
function TaskFlow({ token, user, onLogout }) {
  const [page, setPage]             = useState("dashboard");
  const [projects, setProjects]     = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [dashboard, setDashboard]   = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [taskModal, setTaskModal]   = useState(null);
  const [projectModal, setProjectModal] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [hoveredTask, setHoveredTask] = useState(null);

  const api = useCallback((path, opts) => apiFetch(path, opts, token), [token]);

  useEffect(() => { fetchProjects(); fetchDashboard(); }, []);
  useEffect(() => { fetchTasks(); }, [activeProject]);

  async function fetchProjects() {
    try { setProjects(await api("/projects")); } catch (e) { console.error(e); }
  }
  async function fetchTasks() {
    try {
      const url = activeProject ? `/tasks?projectId=${activeProject}` : "/tasks";
      setTasks(await api(url));
    } catch (e) { console.error(e); }
  }
  async function fetchDashboard() {
    try { setDashboard(await api("/dashboard")); } catch (e) { console.error(e); }
  }

  async function addTask(formData) {
    setLoading(true);
    try {
      const t = await api("/tasks", { method: "POST", body: JSON.stringify(formData) });
      setTasks(prev => [t, ...prev]);
      setTaskModal(null);
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

  const s = makeStyles(sidebarOpen);
  const nav = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "tasks",     icon: "✦", label: "Tasks"     },
    { id: "projects",  icon: "⬡", label: "Projects"  },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      <div style={s.root}>
        <div style={s.sidebar}>
          <div style={s.sidebarTop}>
            <div style={s.logoIcon}>TF</div>
            <span style={s.logo}>TaskFlow</span>
            <button onClick={() => setSidebarOpen(p => !p)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>☰</button>
          </div>
          <div style={{ padding: "16px 10px", flex: 1 }}>
            {nav.map(n => (
              <div key={n.id} style={s.navItem(page === n.id)} onClick={() => { setPage(n.id); setActiveProject(null); }}>
                <span style={s.navIcon}>{n.icon}</span>
                <span style={{ opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s" }}>{n.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 10px", borderTop: "1px solid #1E1E2E" }}>
            <div style={s.navItem(false)} onClick={onLogout}>
              <span style={s.navIcon}>⏻</span>
              <span style={{ opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s", color: "#FF6B6B" }}>Logout</span>
            </div>
            {sidebarOpen && <div style={{ padding: "6px 16px", fontSize: 12, color: "#5050A0" }}>{user.name}</div>}
          </div>
        </div>

        <div style={s.main}>
          <div style={s.topbar}>
            <div style={s.pageTitle}>
              {page === "dashboard" ? "Dashboard"
                : page === "tasks" ? (activeProject ? (projects.find(p => p.id === activeProject)?.title || "") + " – Tasks" : "All Tasks")
                : "Projects"}
            </div>
            {page === "tasks"    && <button style={s.btn("primary")} onClick={() => setTaskModal("new")}>+ New Task</button>}
            {page === "projects" && <button style={s.btn("primary")} onClick={() => setProjectModal(true)}>+ New Project</button>}
          </div>
          <div style={s.content}>
            {page === "dashboard" && dashboard && (
              <DashboardPage s={s} dashboard={dashboard} projects={projects}
                hoveredTask={hoveredTask} setHoveredTask={setHoveredTask}
                openTaskDetail={setDetailTask}
                gotoTasks={() => setPage("tasks")} gotoProjects={() => setPage("projects")} />
            )}
            {page === "dashboard" && !dashboard && (
              <div style={{ color: "#5050A0", padding: 40 }}>Loading dashboard…</div>
            )}
            {page === "tasks" && (
              <TasksPage s={s} tasks={tasks} projects={projects}
                hoveredTask={hoveredTask} setHoveredTask={setHoveredTask}
                openTaskDetail={setDetailTask} deleteTask={deleteTask} updateTask={updateTask} />
            )}
            {page === "projects" && (
              <ProjectsPage s={s} projects={projects} tasks={tasks}
                openProject={id => { setActiveProject(id); setPage("tasks"); }}
                deleteProject={deleteProject} />
            )}
          </div>
        </div>

        {detailTask && <TaskDetailModal s={s} task={detailTask} projects={projects}
          onClose={() => setDetailTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}
        {taskModal === "new" && <NewTaskModal s={s} projects={projects} defaultProjectId={activeProject}
          onClose={() => setTaskModal(null)} onSave={addTask} loading={loading} />}
        {projectModal && <NewProjectModal s={s} onClose={() => setProjectModal(false)} onSave={addProject} />}
      </div>
    </>
  );
}

function DashboardPage({ s, dashboard, projects, hoveredTask, setHoveredTask, openTaskDetail, gotoTasks, gotoProjects }) {
  const { totalTasks = 0, doneTasks = 0, inProgressTasks = 0, pendingTasks = 0, recentTasks = [] } = dashboard;
  const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: "Total Tasks",  val: totalTasks,     color: "#6C63FF" },
          { label: "Completed",    val: doneTasks,       color: "#43D9AD" },
          { label: "Pending",      val: pendingTasks,    color: "#FFD166" },
          { label: "In Progress",  val: inProgressTasks, color: "#FF6B6B" },
        ].map(st => (
          <div key={st.label} style={s.statCard(st.color)}>
            <div style={{ ...s.statNum, color: st.color }}>{st.val ?? 0}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={s.sectionTitle}>Recent Tasks</div>
            <span onClick={gotoTasks} style={{ fontSize: 12, color: "#6C63FF", cursor: "pointer", fontWeight: 600 }}>View all →</span>
          </div>
          {recentTasks.map(t => (
            <div key={t.id} style={s.taskRow(hoveredTask === t.id)}
              onMouseEnter={() => setHoveredTask(t.id)} onMouseLeave={() => setHoveredTask(null)}
              onClick={() => openTaskDetail(t)}>
              <div style={s.priorityDot(PRIORITY_CONFIG[t.priority]?.dot || "#888")} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
              <div style={s.badge(STATUS_CONFIG[t.status] || STATUS_CONFIG["To Do"])}>{t.status}</div>
            </div>
          ))}
          {recentTasks.length === 0 && <div style={{ color: "#5050A0", fontSize: 13, padding: 12 }}>No tasks yet!</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={s.card}>
            <div style={s.sectionTitle}>Overall Progress</div>
            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "#6C63FF" }}>{percent}%</div>
            <div style={{ marginTop: 10, height: 8, background: "#1E1E2E", borderRadius: 99 }}>
              <div style={{ width: `${percent}%`, height: "100%", background: "linear-gradient(90deg,#6C63FF,#43D9AD)", borderRadius: 99, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 12, color: "#7070A0", marginTop: 8 }}>{doneTasks} of {totalTasks} tasks done</div>
          </div>
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={s.sectionTitle}>Projects</div>
              <span onClick={gotoProjects} style={{ fontSize: 12, color: "#6C63FF", cursor: "pointer", fontWeight: 600 }}>View all →</span>
            </div>
            {projects.map(p => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  <span>{p.title}</span>
                  <span style={{ color: "#7070A0", fontWeight: 400 }}>{p.completedCount ?? 0}/{p.taskCount ?? 0}</span>
                </div>
                <div style={{ height: 5, background: "#1E1E2E", borderRadius: 99 }}>
                  <div style={{ width: p.taskCount ? `${Math.round(((p.completedCount || 0) / p.taskCount) * 100)}%` : "0%", height: "100%", background: p.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPage({ s, tasks, projects, hoveredTask, setHoveredTask, openTaskDetail, deleteTask, updateTask }) {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["All", "To Do", "In Progress", "Done"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", background: filter === f ? "linear-gradient(135deg,#6C63FF,#9B88FF)" : "rgba(255,255,255,0.05)", color: filter === f ? "#fff" : "#7070A0", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>{f}</button>
        ))}
      </div>
      <div style={s.card}>
        {shown.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#7070A0" }}>No tasks here yet.</div>}
        {shown.map(t => {
          const pid = t.projectId || t.project_id;
          const proj = projects.find(p => p.id === pid);
          return (
            <div key={t.id} style={{ ...s.taskRow(hoveredTask === t.id), marginBottom: 2 }}
              onMouseEnter={() => setHoveredTask(t.id)} onMouseLeave={() => setHoveredTask(null)}>
              <input type="checkbox" checked={t.status === "Done"} style={{ cursor: "pointer", accentColor: "#6C63FF" }}
                onClick={e => e.stopPropagation()}
                onChange={() => updateTask({ ...t, projectId: pid, status: t.status === "Done" ? "To Do" : "Done" })} />
              <div style={{ flex: 1 }} onClick={() => openTaskDetail(t)}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, textDecoration: t.status === "Done" ? "line-through" : "none", color: t.status === "Done" ? "#5050A0" : "#E8E8F0" }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#7070A0" }}>
                  {proj && <span style={{ color: proj.color, fontWeight: 600 }}>● {proj.title} </span>}
                  {t.due_date && <span>· Due {formatDate(t.due_date)}</span>}
                </div>
              </div>
              <div style={s.badge(STATUS_CONFIG[t.status] || STATUS_CONFIG["To Do"])}>{t.status}</div>
              <div style={{ ...s.priorityDot(PRIORITY_CONFIG[t.priority]?.dot || "#888"), marginLeft: 4 }} />
              <button onClick={e => { e.stopPropagation(); deleteTask(t.id); }} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 16, opacity: 0.6, padding: "0 4px" }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsPage({ s, projects, tasks, openProject, deleteProject }) {
  const [hov, setHov] = useState(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {projects.map(p => {
        const ptasks = tasks.filter(t => (t.projectId || t.project_id) === p.id);
        const done   = p.completedCount ?? ptasks.filter(t => t.status === "Done").length;
        const total  = p.taskCount ?? ptasks.length;
        const pct    = total ? Math.round((done / total) * 100) : 0;
        return (
          <div key={p.id}
            style={{ ...s.projCard(p.color), transform: hov === p.id ? "translateY(-3px)" : "none", borderColor: hov === p.id ? p.color + "66" : "#1E1E2E" }}
            onMouseEnter={() => setHov(p.id)} onMouseLeave={() => setHov(null)}
            onClick={() => openProject(p.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.title}</div>
              <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 14, opacity: 0.5 }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#7070A0", marginBottom: 14 }}>{total} task{total !== 1 ? "s" : ""}</div>
            <div style={{ height: 6, background: "#1A1A28", borderRadius: 99, marginBottom: 8 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 12, color: "#7070A0" }}>{done}/{total} completed</div>
          </div>
        );
      })}
      {projects.length === 0 && <div style={{ color: "#5050A0", fontSize: 14 }}>No projects yet. Create one!</div>}
    </div>
  );
}

function TaskDetailModal({ s, task, projects, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task, projectId: task.projectId || task.project_id });
  const proj = projects.find(p => p.id === (task.projectId || task.project_id));
  return (
    <div style={s.modal} onClick={onClose}>
      <div style={{ ...s.modalBox, minWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>Task Detail</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {!editing ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{task.title}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={s.badge(STATUS_CONFIG[task.status] || STATUS_CONFIG["To Do"])}>{task.status}</span>
              <span style={{ ...s.badge({ bg: (PRIORITY_CONFIG[task.priority]?.color || "#888") + "22", text: PRIORITY_CONFIG[task.priority]?.color || "#888" }) }}>{task.priority} Priority</span>
              {proj && <span style={{ ...s.badge({ bg: proj.color + "22", text: proj.color }) }}>● {proj.title}</span>}
            </div>
            {task.description && <div style={{ fontSize: 14, color: "#A0A0C0", lineHeight: 1.7, marginBottom: 14 }}>{task.description}</div>}
            {task.due_date && <div style={{ fontSize: 13, color: "#7070A0" }}>📅 Due: {formatDate(task.due_date)}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button style={s.btn("primary")} onClick={() => setEditing(true)}>Edit</button>
              <button style={s.btn("secondary")} onClick={() => onUpdate({ ...task, projectId: task.projectId || task.project_id, status: task.status === "Done" ? "To Do" : "Done" })}>
                {task.status === "Done" ? "Mark Incomplete" : "Mark Done"}
              </button>
              <button style={{ ...s.btn("danger"), marginLeft: "auto" }} onClick={() => { onDelete(task.id); onClose(); }}>Delete</button>
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
        <input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
      <div><label style={s.label}>Description</label>
        <textarea style={{ ...s.input, minHeight: 72, resize: "vertical" }} value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={s.label}>Status</label>
          <select style={s.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {["To Do", "In Progress", "Done"].map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label style={s.label}>Priority</label>
          <select style={s.select} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            {["High", "Medium", "Low"].map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
      <div><label style={s.label}>Due Date</label>
        <input type="date" style={s.input} value={form.due_date ? form.due_date.slice(0, 10) : ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
      <div><label style={s.label}>Project</label>
        <select style={s.select} value={form.projectId || form.project_id} onChange={e => setForm(f => ({ ...f, projectId: Number(e.target.value) }))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button style={s.btn("primary")} onClick={onSave}>Save Changes</button>
        <button style={s.btn("secondary")} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NewTaskModal({ s, projects, defaultProjectId, onClose, onSave, loading }) {
  const [form, setForm] = useState({ title: "", description: "", status: "To Do", priority: "Medium", due_date: "", projectId: defaultProjectId || projects[0]?.id });
  return (
    <div style={s.modal} onClick={onClose}>
      <div style={s.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>New Task</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <EditTaskForm form={form} setForm={setForm} projects={projects} s={s}
          onSave={() => { if (form.title.trim()) onSave(form); }} onCancel={onClose} />
        {loading && <div style={{ color: "#7070A0", fontSize: 13, marginTop: 8 }}>Saving…</div>}
      </div>
    </div>
  );
}

function NewProjectModal({ s, onClose, onSave }) {
  const colors = ["#6C63FF", "#FF6B6B", "#43D9AD", "#FFD166", "#60A5FA", "#F472B6"];
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(colors[0]);
  return (
    <div style={s.modal} onClick={onClose}>
      <div style={{ ...s.modalBox, width: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>New Project</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7070A0", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Project Name</label>
          <input style={s.input} placeholder="e.g. Website Redesign" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={s.label}>Color</label>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {colors.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", outline: color === c ? `3px solid ${c}` : "3px solid transparent", outlineOffset: 2 }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btn("primary")} onClick={() => { if (title.trim()) onSave({ title, color }); }}>Create Project</button>
          <button style={s.btn("secondary")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  STYLES FACTORY
// ════════════════════════════════════════════════════════════
function makeStyles(sidebarOpen) {
  return {
    root: { display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0E0E14", color: "#E8E8F0", overflow: "hidden" },
    sidebar: { width: sidebarOpen ? 240 : 64, background: "#13131C", borderRight: "1px solid #1E1E2E", display: "flex", flexDirection: "column", transition: "width 0.25s cubic-bezier(.4,0,.2,1)", overflow: "hidden", flexShrink: 0 },
    sidebarTop: { padding: "20px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1E1E2E" },
    logo: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#6C63FF", whiteSpace: "nowrap", overflow: "hidden", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s", letterSpacing: "-0.5px" },
    logoIcon: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6C63FF,#9B88FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 800, color: "#fff" },
    navItem: (active) => ({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s", background: active ? "rgba(108,99,255,0.18)" : "transparent", color: active ? "#A89FF7" : "#7070A0", fontWeight: active ? 600 : 400, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", marginBottom: 2 }),
    navIcon: { fontSize: 18, flexShrink: 0 },
    main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    topbar: { padding: "16px 28px", borderBottom: "1px solid #1E1E2E", display: "flex", alignItems: "center", gap: 16, background: "#0E0E14" },
    pageTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, flex: 1 },
    btn: (variant = "primary") => ({ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, background: variant === "primary" ? "linear-gradient(135deg,#6C63FF,#9B88FF)" : variant === "danger" ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.06)", color: variant === "primary" ? "#fff" : variant === "danger" ? "#FF6B6B" : "#A0A0C0" }),
    content: { flex: 1, overflow: "auto", padding: 28 },
    card: { background: "#13131C", border: "1px solid #1E1E2E", borderRadius: 16, padding: 20 },
    statCard: (color) => ({ background: "#13131C", border: `1px solid ${color}22`, borderRadius: 16, padding: "20px 24px", flex: 1 }),
    statNum: { fontSize: 36, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" },
    statLabel: { fontSize: 13, color: "#7070A0", marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: "#7070A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 },
    taskRow: (hovered) => ({ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", transition: "background 0.15s", background: hovered ? "rgba(108,99,255,0.08)" : "transparent", borderBottom: "1px solid #1A1A28" }),
    badge: (config) => ({ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: config?.bg || "#222", color: config?.text || "#888", whiteSpace: "nowrap" }),
    priorityDot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),
    projCard: (color) => ({ background: "#13131C", border: `1px solid #1E1E2E`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "border-color 0.2s, transform 0.15s", borderTop: `3px solid ${color}` }),
    input: { width: "100%", background: "#0E0E14", border: "1px solid #1E1E2E", borderRadius: 10, padding: "10px 14px", color: "#E8E8F0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" },
    select: { width: "100%", background: "#0E0E14", border: "1px solid #1E1E2E", borderRadius: 10, padding: "10px 14px", color: "#E8E8F0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box", appearance: "none" },
    label: { fontSize: 12, color: "#7070A0", marginBottom: 6, display: "block", fontWeight: 600 },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modalBox: { background: "#13131C", border: "1px solid #1E1E2E", borderRadius: 20, padding: 28, width: 480, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto" },
  };
}
