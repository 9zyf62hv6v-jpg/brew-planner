-- ============================================================
-- Рецепты: расширяем таблицу recipes и создаём ингредиенты
-- ============================================================

-- Расширяем recipes параметрами для расчётов
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS og NUMERIC(5,3),              -- Начальная плотность (Original Gravity)
  ADD COLUMN IF NOT EXISTS fg NUMERIC(5,3),              -- Конечная плотность (Final Gravity)
  ADD COLUMN IF NOT EXISTS ibu NUMERIC(5,1),             -- Горечь (IBU)
  ADD COLUMN IF NOT EXISTS abv NUMERIC(4,2),             -- Алкоголь (%)
  ADD COLUMN IF NOT EXISTS volume_l NUMERIC(8,2) DEFAULT 5400,  -- Объём партии, л
  ADD COLUMN IF NOT EXISTS boil_time_min INT DEFAULT 60, -- Время кипячения, мин
  ADD COLUMN IF NOT EXISTS efficiency NUMERIC(4,1) DEFAULT 75; -- Эффективность затирания, %

-- Таблица ингредиентов рецепта
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,           -- 'malt' | 'hop' | 'yeast' | 'other'
  name VARCHAR(200) NOT NULL,
  amount NUMERIC(10,3) NOT NULL,       -- Количество (кг для солода, г для хмеля, шт/пакеты для дрожжей)
  unit VARCHAR(10) NOT NULL,           -- 'kg' | 'g' | 'pcs' | 'l'
  -- Специфичные поля:
  color_ebc NUMERIC(6,1),              -- Для солода: цвет в EBC
  potential_sg NUMERIC(5,3),           -- Для солода: потенциальная плотность
  alpha_acid NUMERIC(4,1),             -- Для хмеля: % α-кислоты
  boil_time_min INT,                   -- Для хмеля: время кипячения (мин)
  attenuation NUMERIC(4,1),            -- Для дрожжей: аттенюация (%)
  sort_order INT DEFAULT 0,            -- Порядок в списке
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe
  ON recipe_ingredients(recipe_id);

-- Проверка что всё создалось
\d recipes
\d recipe_ingredients