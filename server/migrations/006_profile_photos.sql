-- Фото учеников, выбранные в игре (маленький JPEG)
CREATE TABLE IF NOT EXISTS profile_photos (
  tg_id  INTEGER NOT NULL,
  pid    TEXT NOT NULL,
  key    TEXT NOT NULL,           -- случайный ключ для адреса /photo/<ключ>
  img    BLOB NOT NULL,
  PRIMARY KEY (tg_id, pid)
);
CREATE UNIQUE INDEX IF NOT EXISTS profile_photos_key ON profile_photos(key);
