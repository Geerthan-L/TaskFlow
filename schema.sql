-- ============================================================
--  TaskFlow – MySQL Schema
--  Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskflow;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ── Projects ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  title      VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  NOT NULL DEFAULT '#6C63FF',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ── Tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          INT          NOT NULL AUTO_INCREMENT,
  project_id  INT          NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      ENUM('To Do','In Progress','Done') NOT NULL DEFAULT 'To Do',
  priority    ENUM('High','Medium','Low')        NOT NULL DEFAULT 'Medium',
  due_date    DATE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_projects_user   ON projects (user_id);
CREATE INDEX idx_tasks_project   ON tasks (project_id);
CREATE INDEX idx_tasks_status    ON tasks (status);

-- ── Sample seed data (optional – remove in production) ────────
INSERT INTO users (name, email, password) VALUES
  ('Demo User', 'demo@taskflow.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  -- ^ Replace with a real bcrypt hash. Generate with:
  --   node -e "require('bcryptjs').hash('password123',10).then(h=>console.log(h))"

INSERT INTO projects (user_id, title, color) VALUES
  (1, 'Website Redesign', '#6C63FF'),
  (1, 'Mobile App MVP',   '#FF6B6B'),
  (1, 'Backend API',      '#43D9AD');

INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES
  (1, 'Design homepage wireframes', 'Low-fi and hi-fi mockups for the landing page', 'In Progress', 'High',   '2025-04-10'),
  (1, 'Write About page copy',      'Draft team bio content',                        'To Do',       'Medium', '2025-04-15'),
  (1, 'Set up analytics',           'Integrate Google Analytics',                    'Done',        'Low',    '2025-04-05'),
  (2, 'User authentication flow',   'JWT login/signup screens',                      'Done',        'High',   '2025-04-01'),
  (2, 'Push notification setup',    'Configure FCM and test devices',                'In Progress', 'High',   '2025-04-12'),
  (3, 'Define REST endpoints',      'Document all routes with Swagger',              'To Do',       'Medium', '2025-04-20'),
  (3, 'Database schema finalization','Review and lock ERD with team',               'Done',        'High',   '2025-04-03');
