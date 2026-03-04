
-- Remove all data for Neemias except the profile and auth user
-- user_id = '38e74d0a-13ba-48c4-82ef-b58b99c4eb5e'

DELETE FROM user_campanhas WHERE user_id = '38e74d0a-13ba-48c4-82ef-b58b99c4eb5e';
DELETE FROM user_roles WHERE user_id = '38e74d0a-13ba-48c4-82ef-b58b99c4eb5e';
DELETE FROM user_access_control WHERE user_id = '38e74d0a-13ba-48c4-82ef-b58b99c4eb5e';
DELETE FROM trusted_devices WHERE user_id = '38e74d0a-13ba-48c4-82ef-b58b99c4eb5e';

-- Reset profile fields to clean state
UPDATE profiles SET 
  campanha_id = NULL,
  candidate_id = NULL,
  parent_id = NULL,
  supporter_id = NULL,
  pin = NULL,
  avatar_url = NULL
WHERE id = '38e74d0a-13ba-48c4-82ef-b58b99c4eb5e';
