ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'camisa';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
    CHECK (category IN ('camisa', 'bone', 'moletom'));

UPDATE public.products
SET featured = false
WHERE image = '';

CREATE INDEX IF NOT EXISTS products_featured_order_idx
  ON public.products (featured, active, sort_order, id);

CREATE INDEX IF NOT EXISTS products_category_color_price_idx
  ON public.products (category, color, price)
  WHERE active = true;
