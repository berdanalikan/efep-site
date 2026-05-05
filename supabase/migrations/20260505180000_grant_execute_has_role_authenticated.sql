-- RLS policies on efep_registrations and user_roles call has_role() in USING ().
-- The session role (authenticated) must have EXECUTE on the function, otherwise:
--   SQLSTATE 42501 permission denied for function has_role
-- An earlier REVOKE FROM authenticated blocked legitimate policy evaluation.
-- anon remains without EXECUTE (direct RPC abuse mitigated for unauthenticated callers).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
