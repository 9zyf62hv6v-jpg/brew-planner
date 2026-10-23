-- ============================================================
-- QA-журнал: измерения по варкам
-- ============================================================

CREATE TABLE IF NOT EXISTS measurements (
  id SERIAL PRIMARY KEY,
  batch_id INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  measured_at TIMESTAMP NOT NULL DEFAULT now(),
  ph NUMERIC(3,2),              -- 0.00 – 14.00
  gravity NUMERIC(5,3),         -- плотность (SG), напр. 1.048
  temperature NUMERIC(5,1),     -- °C
  pressure NUMERIC(5,2),        -- бар (для ЦКТ под давлением)
  volume_l NUMERIC(8,1),        -- объём на момент измерения (опционально)
  notes TEXT,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_measurements_batch
  ON measurements(batch_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_measurements_user
  ON measurements(user_id);

-- Покажем структуру
\d measurements