-- Let the storefront read branding tokens without opening other settings.
GRANT SELECT ON public.settings TO anon, authenticated;

DROP POLICY IF EXISTS settings_whatsapp_public ON public.settings;
CREATE POLICY settings_whatsapp_public ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'whatsapp_number' OR key = 'storefront_branding');
