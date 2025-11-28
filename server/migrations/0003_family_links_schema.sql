-- Ensure the family_links table includes all columns used by the application
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'family_links'
  ) THEN
    CREATE TABLE family_links (
      owner_uid TEXT NOT NULL,
      contact_uid TEXT NOT NULL,
      alias TEXT,
      role TEXT DEFAULT 'family',
      invite_token TEXT,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT family_links_owner_contact_unique UNIQUE (owner_uid, contact_uid)
    );
  END IF;
END $$;

ALTER TABLE family_links ADD COLUMN IF NOT EXISTS owner_uid TEXT NOT NULL;
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS contact_uid TEXT NOT NULL;
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE family_links ALTER COLUMN role SET DEFAULT 'family';
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE family_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_links_owner_contact_unique'
  ) THEN
    ALTER TABLE family_links ADD CONSTRAINT family_links_owner_contact_unique UNIQUE (owner_uid, contact_uid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_links_invite_token_key'
  ) THEN
    ALTER TABLE family_links ADD CONSTRAINT family_links_invite_token_key UNIQUE (invite_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_family_links_owner ON family_links (owner_uid);
