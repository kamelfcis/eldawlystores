-- Dynamic product specs live on products.document as an ordered list.
-- Canonical shape: { "specs": [ { "label": "الذاكرة", "value": "12 جيجا" } ] }

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS document jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.document IS
  'Ordered product specs JSON: { specs: [{ label, value }] }. Empty object when none.';
