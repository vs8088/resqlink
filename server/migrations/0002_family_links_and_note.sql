CREATE TABLE IF NOT EXISTS family_links (
  owner_uid TEXT NOT NULL,
  contact_uid TEXT NOT NULL,
  alias TEXT,
  role TEXT DEFAULT 'family',
  invite_token TEXT UNIQUE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_uid, contact_uid)
);

CREATE INDEX IF NOT EXISTS idx_family_links_owner ON family_links (owner_uid);
