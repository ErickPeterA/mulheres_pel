-- Permitir que usuários aprovados vejam perfis aprovados de não-admins (via view profiles_public com security_invoker)
CREATE POLICY "Approved users can view approved non-admin profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  approval_status = 'approved'::public.approval_status
  AND NOT public.has_role(user_id, 'admin'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.approval_status = 'approved'::public.approval_status
  )
);