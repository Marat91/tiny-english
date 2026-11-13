-- Группы вместо одной «семьи»: человек может состоять в нескольких группах.
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
INSERT OR IGNORE INTO groups (code, name, owner, created) SELECT code, 'Семья', owner, created FROM families;
INSERT OR IGNORE INTO members (code, tg_id) SELECT family, tg_id FROM users WHERE family IS NOT NULL;
ALTER TABLE users ADD COLUMN public INTEGER NOT NULL DEFAULT 1;   -- показывать ли в общем рейтинге
