-- Покупки за Звёзды Telegram
CREATE TABLE IF NOT EXISTS purchases (
  charge  TEXT PRIMARY KEY,        -- номер платежа в Telegram (по нему же можно вернуть Звёзды)
  tg_id   INTEGER NOT NULL,
  pid     TEXT,                    -- какому ученику
  item    TEXT NOT NULL,
  stars   INTEGER NOT NULL,
  created TEXT NOT NULL,
  granted INTEGER NOT NULL DEFAULT 0   -- игра уже выдала покупку
);
