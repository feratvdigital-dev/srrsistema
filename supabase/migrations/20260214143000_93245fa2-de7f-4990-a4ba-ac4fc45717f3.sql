
-- Revoke direct SELECT on password columns from anon and authenticated roles
-- This prevents anyone from reading passwords via the client SDK

REVOKE SELECT (password) ON public.app_users FROM anon;
REVOKE SELECT (password) ON public.app_users FROM authenticated;

REVOKE SELECT (password) ON public.technicians FROM anon;
REVOKE SELECT (password) ON public.technicians FROM authenticated;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all access to app_users" ON public.app_users;

-- Create restrictive policies for app_users:
-- Only allow SELECT on non-password columns (the column revoke handles password hiding)
-- Deny INSERT/UPDATE/DELETE from anon (only edge function with service_role can manage)
CREATE POLICY "app_users_select_authenticated"
ON public.app_users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "app_users_deny_anon"
ON public.app_users FOR SELECT
TO anon
USING (false);
