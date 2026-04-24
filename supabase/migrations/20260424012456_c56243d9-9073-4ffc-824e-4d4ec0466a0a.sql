-- 1. Create status enum
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending';

-- 3. Backfill: admins approved, existing non-admins approved (avoid locking out current users)
UPDATE public.profiles p
SET approval_status = 'approved'
WHERE approval_status = 'pending';

-- 4. Replace handle_new_user to set approval based on admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  is_admin_email := lower(NEW.email) IN ('leugc@icloud.com', 'erickaraujobest@gmail.com');

  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, user_code, profile_completed, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN is_admin_email THEN NULL ELSE public.generate_unique_user_code() END,
    is_admin_email,
    CASE WHEN is_admin_email THEN 'approved'::public.approval_status ELSE 'pending'::public.approval_status END
  );

  IF is_admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Recreate profiles_public to include approval_status filter at view-level
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, full_name, company_name, owner_name, segment, specialties, services,
  description, location, photo_url, avatar_url, logo_url, cover_url,
  instagram, whatsapp, working_hours, advantage, profile_completed, approval_status,
  created_at, updated_at
FROM public.profiles
WHERE approval_status = 'approved';

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- 7. Allow authenticated users to read approval_status of their own profile via base table policy (already exists for owner/admin) — no change needed.

-- 8. Admin approval RPC
CREATE OR REPLACE FUNCTION public.admin_set_user_status(_target_user_id uuid, _status public.approval_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o status';
  END IF;
  UPDATE public.profiles SET approval_status = _status, updated_at = now()
  WHERE user_id = _target_user_id;
END;
$$;