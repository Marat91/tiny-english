-- Дуэли: набор вопросов, приглашённые и результаты
CREATE TABLE IF NOT EXISTS duels (
  id      TEXT PRIMARY KEY,
  owner   INTEGER NOT NULL,
  created TEXT NOT NULL,
  q       TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS duel_players (
  id     TEXT NOT NULL,
  tg_id  INTEGER NOT NULL,
  PRIMARY KEY (id, tg_id)
);
CREATE INDEX IF NOT EXISTS duel_players_user ON duel_players(tg_id);
CREATE TABLE IF NOT EXISTS duel_scores (
  id     TEXT NOT NULL,
  tg_id  INTEGER NOT NULL,
  pid    TEXT NOT NULL,
  name   TEXT, avatar TEXT,
  score  INTEGER NOT NULL,
  ms     INTEGER NOT NULL,
  PRIMARY KEY (id, tg_id, pid)
);
