-- ============================================================
-- Задачи для команды
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',      -- 'todo' | 'done'
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',  -- 'low' | 'normal' | 'high'
  due_date DATE,
  batch_id INT REFERENCES batches(id) ON DELETE SET NULL,
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- owner_id
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_batch ON tasks(batch_id);

\d tasks