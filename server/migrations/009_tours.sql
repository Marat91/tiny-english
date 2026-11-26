-- Турнир недели в группе: лучший результат каждого ученика за неделю
CREATE TABLE IF NOT EXISTS tours (
  code   TEXT NOT NULL,
  week   INTEGER NOT NULL,
  tg_id  INTEGER NOT NULL,
  pid    TEXT NOT NULL,
  name   TEXT,
  avatar TEXT,
  score  INTEGER NOT NULL DEFAULT 0,
  ms     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (code, week, tg_id, pid)
);
