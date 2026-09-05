ALTER TABLE projects ADD COLUMN IF NOT EXISTS selected_expert_id UUID REFERENCES users(id);
