-- One-time correction: align permit applications to OC mapped to the same police station.
-- PostgreSQL script. Safe to re-run.

BEGIN;

-- 1) Pick one active OC per police station (lowest user_id) and assign consistently.
WITH station_oc AS (
    SELECT DISTINCT ON (u.police_station_id)
           u.police_station_id,
           u.user_id
    FROM users u
    WHERE u.role_id = 5
      AND u.is_active = true
      AND u.police_station_id IS NOT NULL
    ORDER BY u.police_station_id, u.user_id
)
UPDATE permit_applications pa
SET assigned_oc_user_id = so.user_id
FROM station_oc so
WHERE pa.police_station_id = so.police_station_id
  AND (pa.assigned_oc_user_id IS NULL OR pa.assigned_oc_user_id <> so.user_id);

-- 2) If an assigned OC is invalid for that police station, clear it.
UPDATE permit_applications pa
SET assigned_oc_user_id = NULL
WHERE pa.assigned_oc_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM users u
      WHERE u.user_id = pa.assigned_oc_user_id
        AND u.role_id = 5
        AND u.is_active = true
        AND u.police_station_id = pa.police_station_id
  );

COMMIT;

-- Optional verification queries:
-- SELECT pa.application_id, pa.police_station_id, pa.assigned_oc_user_id
-- FROM permit_applications pa
-- WHERE pa.current_stage = 'OC_PENDING'
-- ORDER BY pa.application_id;
