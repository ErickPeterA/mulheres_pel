-- 1. Função auxiliar: verifica se o usuário atual está aprovado (SECURITY DEFINER evita recursão e é cacheável)
CREATE OR REPLACE FUNCTION public.is_current_user_approved()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND approval_status = 'approved'::public.approval_status
  );
$$;

-- 2. Substituir a policy lenta/com EXISTS recursivo por uma versão usando a função
DROP POLICY IF EXISTS "Approved users can view approved non-admin profiles" ON public.profiles;

CREATE POLICY "Approved users can view approved non-admin profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  approval_status = 'approved'::public.approval_status
  AND NOT public.has_role(user_id, 'admin'::public.app_role)
  AND public.is_current_user_approved()
);

-- 3. Índices para acelerar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);