-- PostgreSQL Trigger to Sync User Profile Data to Expert Profile
-- This ensures that when a user updates their name/bio/image in the users table, it reflects in their expert profile if it exists.

CREATE OR REPLACE FUNCTION sync_user_to_expert_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE expert_profiles
    SET 
        profile_image_url = NEW.profile_image_url,
        bio = NEW.bio,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_to_expert ON users;
CREATE TRIGGER trg_sync_user_to_expert
AFTER UPDATE OF profile_image_url, bio ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_to_expert_profile();

-- PostgreSQL Trigger to Sync Expert Profile Data back to User Profile
-- This ensures that when an expert updates their profile, the base users table is also updated.

CREATE OR REPLACE FUNCTION sync_expert_to_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        profile_image_url = NEW.profile_image_url,
        bio = NEW.bio,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_expert_to_user ON expert_profiles;
CREATE TRIGGER trg_sync_expert_to_user
AFTER UPDATE OF profile_image_url, bio ON expert_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_expert_to_user_profile();
