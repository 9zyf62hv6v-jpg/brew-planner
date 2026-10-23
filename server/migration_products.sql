-- ============================================================
-- Продукция (склад готового пива)
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  batch_id INT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,              -- 'keg' | 'bottle' | 'can'
  package_volume_l NUMERIC(6,3) NOT NULL, -- объём упаковки, л
  quantity INT NOT NULL,                  -- количество единиц
  location VARCHAR(100),                  -- 'Склад' | 'Холодильник' | ...
  bottled_at DATE,                        -- дата розлива
  notes TEXT,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_batch ON products(batch_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);

\d products