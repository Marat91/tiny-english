-- Слово дня от бота и домашнее задание в группе
ALTER TABLE users ADD COLUMN wotd_on INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN wotd TEXT;          -- слова, которые ребёнок сейчас учит (JSON из игры)
ALTER TABLE users ADD COLUMN wotd_sent TEXT;     -- местная дата последней отправки
ALTER TABLE groups ADD COLUMN hw TEXT;           -- домашка: {"topics": [...], "due": "ГГГГ-ММ-ДД"}
CREATE TABLE IF NOT EXISTS hw_done (
  code TEXT NOT NULL, tg_id INTEGER NOT NULL, pid TEXT NOT NULL,
  name TEXT, done TEXT,                        -- какие темы из домашки пройдены (JSON)
  PRIMARY KEY (code, tg_id, pid)
);
