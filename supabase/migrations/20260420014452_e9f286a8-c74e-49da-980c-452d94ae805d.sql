-- 1) Atualiza a função handle_new_user para NÃO gerar user_code para admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  is_admin_email := lower(NEW.email) = 'leugc@hotmail.com';

  -- Insere perfil. Admins não recebem user_code e ficam marcados como completos
  -- (para não verem o modal de boas-vindas / completar perfil).
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, user_code, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN is_admin_email THEN NULL ELSE public.generate_unique_user_code() END,
    is_admin_email
  );

  IF is_admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Garante que o trigger existe (caso tenha sido removido)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3) Limpa user_code e marca como completo qualquer admin já existente
UPDATE public.profiles p
SET user_code = NULL,
    profile_completed = true
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'admin'
);