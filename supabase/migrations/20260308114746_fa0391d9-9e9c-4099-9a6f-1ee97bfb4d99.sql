ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS condition text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS negotiable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT ARRAY['💵 Cash']::text[];