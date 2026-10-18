CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  picture TEXT,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at);
