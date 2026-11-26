-- Отчёт родителям раз в неделю и дневные лимиты для разговора с питомцем и проверки произношения
ALTER TABLE users ADD COLUMN weekly_on INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN week TEXT;          -- последняя сводка за неделю из игры (JSON)
ALTER TABLE users ADD COLUMN week_sent TEXT;     -- местная дата, когда отчёт уже отправлен
CREATE TABLE IF NOT EXISTS usage (
  tg_id INTEGER NOT NULL,
  day   TEXT NOT NULL,                           -- ГГГГ-ММ-ДД по UTC
  kind  TEXT NOT NULL,                           -- chat, hear
  n     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tg_id, day, kind)
);
