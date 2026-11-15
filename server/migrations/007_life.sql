-- Жизнь питомца: комната для гостей, подарки, угощения, просьбы и общая цель группы
ALTER TABLE profiles ADD COLUMN room TEXT;
CREATE TABLE IF NOT EXISTS gifts (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  to_tg     INTEGER NOT NULL,
  to_pid    TEXT NOT NULL,
  from_tg   INTEGER NOT NULL,
  from_name TEXT,
  kind      TEXT NOT NULL,          -- b косточки, i вещь, t угощение в гостях
  val       TEXT,
  card      INTEGER NOT NULL DEFAULT 0,
  created   TEXT NOT NULL,
  taken     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS gifts_to ON gifts(to_tg, taken);
CREATE TABLE IF NOT EXISTS treats (
  from_tg INTEGER NOT NULL, to_tg INTEGER NOT NULL, to_pid TEXT NOT NULL, day TEXT NOT NULL,
  PRIMARY KEY (from_tg, to_tg, to_pid, day)
);
CREATE TABLE IF NOT EXISTS asks (
  code TEXT NOT NULL, tg_id INTEGER NOT NULL, pid TEXT NOT NULL,
  name TEXT, n INTEGER NOT NULL, item TEXT, created TEXT NOT NULL,
  PRIMARY KEY (code, tg_id, pid)
);
CREATE TABLE IF NOT EXISTS funds (
  code  TEXT PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS fund_parts (
  code TEXT NOT NULL, tg_id INTEGER NOT NULL, pid TEXT NOT NULL,
  name TEXT, n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (code, tg_id, pid)
);
