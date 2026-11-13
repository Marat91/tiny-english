-- Настоящие фото профиля, полученные через бота (маленькие копии)
CREATE TABLE IF NOT EXISTS user_photos (
  tg_id   INTEGER PRIMARY KEY,
  key     TEXT NOT NULL,          -- случайный ключ для адреса /photo/<ключ>
  img     BLOB,                   -- пусто, если фото нет или оно скрыто
  type    TEXT,
  checked TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_photos_key ON user_photos(key);
