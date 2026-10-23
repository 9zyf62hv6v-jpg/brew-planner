-- Владелец пивоварни (у кого owner_id = id — тот владелец; у сотрудников owner_id = id владельца)
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Существующие пользователи становятся владельцами самих себя
UPDATE users SET owner_id = id WHERE owner_id IS NULL;

-- Убеждаемся, что роль 'owner' у владельцев
UPDATE users SET role = 'owner' WHERE id = owner_id;

-- Таблица приглашений
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'brewer',
  used BOOLEAN DEFAULT FALSE,
  used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_owner ON invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_users_owner ON users(owner_id);