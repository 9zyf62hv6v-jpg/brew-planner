-- Удаляем таблицы, если существуют (для чистого перезапуска)
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS tanks CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Пользователи
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'brewer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Площадки
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ЦКТ (танки)
CREATE TABLE tanks (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  volume_hl INTEGER NOT NULL, -- объём в гектолитрах
  sort_order INTEGER DEFAULT 0
);

-- Рецепты
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  style VARCHAR(100),
  color VARCHAR(20) DEFAULT '#4CAF50', -- HEX-цвет для диаграммы
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Варки
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  tank_id INTEGER REFERENCES tanks(id) ON DELETE CASCADE,
  volume_l INTEGER NOT NULL, -- объём в литрах
  start_week INTEGER NOT NULL, -- номер недели старта (36-52)
  end_week INTEGER NOT NULL,   -- номер недели конца
  status VARCHAR(30) DEFAULT 'planned', -- planned | active | done
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Тестовые данные: площадка
INSERT INTO locations (name, description) VALUES
  ('Основная', 'Главное производство');

-- Тестовые данные: ЦКТ (все на площадке 1)
INSERT INTO tanks (location_id, name, volume_hl, sort_order) VALUES
  (1, 'ЦКТ-01', 60, 1),
  (1, 'ЦКТ-02', 60, 2),
  (1, 'ЦКТ-03', 60, 3),
  (1, 'ЦКТ-04', 60, 4),
  (1, 'ЦКТ-05', 60, 5),
  (1, 'ЦКТ-06', 60, 6),
  (1, 'ЦКТ-07', 120, 7),
  (1, 'ЦКТ-08', 120, 8),
  (1, 'ЦКТ-09', 120, 9),
  (1, 'ЦКТ-10', 120, 10);

-- Тестовые данные: рецепты
INSERT INTO recipes (name, style, color) VALUES
  ('Светлый лагер', 'Lager', '#4CAF50'),
  ('Вишнёвый эль', 'Cherry Ale', '#B45309'),
  ('Hazy IPA', 'IPA', '#E91E63'),
  ('Малиновый эль', 'Raspberry Ale', '#2196F3'),
  ('Oatmeal Stout', 'Stout', '#607D8B');

-- Тестовые данные: варки (по одной на каждую строку с диаграммы)
INSERT INTO batches (recipe_id, tank_id, volume_l, start_week, end_week, status) VALUES
  (1, 1, 5400, 36, 42, 'done'),
  (2, 1, 5400, 44, 48, 'planned'),
  (1, 2, 5400, 46, 52, 'planned'),
  (2, 3, 5400, 44, 48, 'planned'),
  (3, 4, 5400, 45, 49, 'planned'),
  (4, 5, 5400, 46, 50, 'planned'),
  (3, 7, 10800, 44, 49, 'planned'),
  (1, 8, 10800, 46, 52, 'planned'),
  (5, 9, 10800, 45, 51, 'planned'),
  (3, 10, 10800, 48, 52, 'planned');