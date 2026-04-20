-- 1. Atualizar handle_new_user para suportar múltiplos admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  is_admin_email := lower(NEW.email) IN ('leugc@hotmail.com', 'erickaraujobest@gmail.com');

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

-- 2. Remover totalmente a conta antiga erickaraujobest@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'erickaraujobest@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.user_photos WHERE user_id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
END $$;

-- 3. Política para admins poderem deletar perfis
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Função segura para admins excluírem usuários completamente
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Apenas admins podem executar
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Não permitir auto-exclusão
  IF auth.uid() = _target_user_id THEN
    RAISE EXCEPTION 'Você não pode excluir sua própria conta';
  END IF;

  DELETE FROM public.user_photos WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$function$;