-- Backfill created_at for existing accounts that have NULL created_at
-- Set to current timestamp for existing rows
UPDATE accounts 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;





