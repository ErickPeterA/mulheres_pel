-- 1) Função para buscar o user_id de um perfil aprovado não-admin pelo código único.
-- Permite que QUALQUER usuário aprovado encontre outro pelo código sem expor a tabela inteira.
CREATE OR REPLACE FUNCTION public.find_user_id_by_code(_code text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  -- Apenas usuários aprovados podem realizar a busca
  IF NOT public.is_current_user_approved() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN NULL;
  END IF;

  SELECT p.user_id INTO found_user_id
  FROM public.profiles p
  WHERE p.user_code = _code
    AND p.approval_status = 'approved'::public.approval_status
    AND NOT public.has_role(p.user_id, 'admin')
  LIMIT 1;

  RETURN found_user_id;
END;
$$;

-- 2) Função para o admin listar todos os usuários COM o user_code
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  user_code text,
  approval_status public.approval_status,
  profile_completed boolean,
  created_at timestamptz,
  is_admin boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.user_code,
    p.approval_status,
    p.profile_completed,
    p.created_at,
    public.has_role(p.user_id, 'admin') AS is_admin
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- 3) Garantir que admins NÃO tenham user_code (limpa qualquer código existente em admins)
UPDATE public.profiles p
SET user_code = NULL
WHERE public.has_role(p.user_id, 'admin')
  AND p.user_code IS NOT NULL;