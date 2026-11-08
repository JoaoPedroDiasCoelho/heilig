CREATE TABLE IF NOT EXISTS public.product_stock (
  product_id integer NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL CHECK (size IN ('P', 'M', 'G', 'GG', 'EXG')),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, size)
);

INSERT INTO public.product_stock (product_id, size, quantity)
SELECT product.id, sizes.size, 0
FROM public.products AS product
CROSS JOIN (VALUES ('P'), ('M'), ('G'), ('GG'), ('EXG')) AS sizes(size)
ON CONFLICT (product_id, size) DO NOTHING;
