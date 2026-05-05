-- PostgREST uses the Postgres role matching the JWT (authenticated after login).
-- Ensure SELECT is granted; RLS policies still restrict which rows are visible.
GRANT SELECT ON TABLE public.efep_registrations TO authenticated;
