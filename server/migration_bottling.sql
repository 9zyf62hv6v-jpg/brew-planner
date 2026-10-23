-- Добавляем поля для розлива в таблицу варок
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS bottling_week INT,
ADD COLUMN IF NOT EXISTS bottling_volume_l INT;

-- Проверим, что добавилось
\d batches