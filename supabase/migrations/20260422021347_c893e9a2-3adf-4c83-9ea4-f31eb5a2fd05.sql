-- 1. Criar view pública de profiles SEM user_code, email, phone (campos sensíveis)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  full_name,
  company_name,
  owner_name,
  segment,
  description,
  location,
  advantage,
  working_hours,
  whatsapp,
  instagram,
  specialties,
  services,
  photo_url,
  avatar_url,
  cover_url,
  logo_url,
  profile_completed,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

-- 2. Restringir SELECT direto na tabela profiles: apenas o dono ou admin pode ver TODOS os campos (incluindo user_code, email, phone)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Owner or admin can view full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));