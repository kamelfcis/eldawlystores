-- Address book fields, and WITH CHECK so inserts/updates stay on the caller's own rows.
-- addresses_own keeps admin access. profiles_update stays limited to the owner's id.

ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

DROP POLICY IF EXISTS addresses_own ON public.addresses;
CREATE POLICY addresses_own ON public.addresses
  FOR ALL
  USING (auth.uid() = user_id OR private.is_admin())
  WITH CHECK (auth.uid() = user_id OR private.is_admin());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
