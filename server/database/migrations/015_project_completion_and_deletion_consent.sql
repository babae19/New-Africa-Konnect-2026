-- Mutual completion and deletion workflow for client/expert projects.
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS delivery_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deletion_consented_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_consented_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_pending_deletion
ON projects (selected_expert_id, deletion_requested_at)
WHERE deletion_requested_at IS NOT NULL AND deletion_consented_at IS NULL;
