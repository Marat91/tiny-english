CREATE TABLE IF NOT EXISTS users (
  tg_id         INTEGER PRIMARY KEY,
  name          TEXT,
  tz            INTEGER NOT NULL DEFAULT -180,   -- смещение в минутах, как Date.getTimezoneOffset()
  remind_on     INTEGER NOT NULL DEFAULT 1,
  remind_hour   INTEGER NOT NULL DEFAULT 18,
  last_active   TEXT,                            -- местная дата последнего занятия, ГГГГ-ММ-ДД
  last_reminded TEXT,
  family        TEXT
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
