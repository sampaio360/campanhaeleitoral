-- Add unique constraint on user_id to enforce one role per user
-- First clean up any duplicate roles (keep the one with the "highest" role)
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.user_id = b.user_id
  AND a.id < b.id;

-- Now add the unique constraint
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);