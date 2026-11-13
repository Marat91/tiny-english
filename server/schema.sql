CREATE TABLE IF NOT EXISTS users (
  tg_id         INTEGER PRIMARY KEY,
  name          TEXT,
  tz            INTEGER NOT NULL DEFAULT -180,   -- смещение в минутах, как Date.getTimezoneOffset()
  remind_on     INTEGER NOT NULL DEFAULT 1,
  remind_hour   INTEGER NOT NULL DEFAULT 18,
  last_active   TEXT,                            -- местная дата последнего занятия, ГГГГ-ММ-ДД
  last_reminded TEXT,
  family        TEXT,                           -- устарело, заменено таблицей members
  public        INTEGER NOT NULL DEFAULT 1,     -- показывать ли в общем рейтинге
  photo         TEXT                            -- ссылка на фото профиля Telegram
);
CREATE TABLE IF NOT EXISTS profiles (
  tg_id   INTEGER NOT NULL,
  pid     TEXT NOT NULL,
  name    TEXT, avatar TEXT, char TEXT,
  stars   INTEGER NOT NULL DEFAULT 0,
  streak  INTEGER NOT NULL DEFAULT 0,
  last    TEXT,
  PRIMARY KEY (tg_id, pid)
);
CREATE TABLE IF NOT EXISTS families (
  code    TEXT PRIMARY KEY,
  owner   INTEGER NOT NULL,
  created TEXT
);
CREATE INDEX IF NOT EXISTS users_family ON users(family);
CREATE TABLE IF NOT EXISTS groups (
  code    TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  owner   INTEGER NOT NULL,
  created TEXT
);
CREATE TABLE IF NOT EXISTS members (
  code   TEXT NOT NULL,
  tg_id  INTEGER NOT NULL,
  PRIMARY KEY (code, tg_id)
);
CREATE INDEX IF NOT EXISTS members_user ON members(tg_id);
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
