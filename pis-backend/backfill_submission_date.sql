-- One-time backfill for existing permit applications missing submission_date.
-- Safe to run multiple times (idempotent).

BEGIN;

-- Ensure the column exists in case the app has not auto-created it yet.
ALTER TABLE permit_applications
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP;

-- Backfill only old rows where submission_date is null.
-- Preferred source: start_date_time (best available historical timestamp in this schema).
UPDATE permit_applications
SET submission_date = COALESCE(start_date_time, end_date_time, NOW())
WHERE submission_date IS NULL;

COMMIT;

-- Optional verification
-- SELECT COUNT(*) AS remaining_nulls
-- FROM permit_applications
-- WHERE submission_date IS NULL;
