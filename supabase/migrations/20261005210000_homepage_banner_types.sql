-- Banner rows are explicit: announcement, hero, or offer.
-- image_url is optional so an announcement can be text plus an optional image.

ALTER TABLE public.homepage_banners
  ADD COLUMN type text NOT NULL DEFAULT 'hero';

ALTER TABLE public.homepage_banners
  ADD CONSTRAINT homepage_banners_type_check
  CHECK (type IN ('announcement', 'hero', 'offer'));

ALTER TABLE public.homepage_banners
  ALTER COLUMN image_url DROP NOT NULL;

-- First active row by sort_order becomes the hero. Every other existing row becomes an offer.
WITH first_active AS (
  SELECT id
  FROM public.homepage_banners
  WHERE is_active
  ORDER BY sort_order ASC, id ASC
  LIMIT 1
)
UPDATE public.homepage_banners
SET type = CASE
  WHEN id = (SELECT id FROM first_active) THEN 'hero'
  ELSE 'offer'
END;
