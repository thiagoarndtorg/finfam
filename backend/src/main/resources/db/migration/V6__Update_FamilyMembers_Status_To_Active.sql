-- Update all existing family members to ACTIVE status
-- This is needed because the /api/family/{id}/members endpoint requires ACTIVE members
UPDATE family_members SET status = 'ACTIVE' WHERE status IN ('PENDING', 'INACTIVE');



