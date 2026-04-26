ALTER TABLE public.marketplace_profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS seller_type text DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS whatsapp_same boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS area text,
ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT ARRAY['💵 Cash']::text[],
ADD COLUMN IF NOT EXISTS response_time text DEFAULT 'few_hours',
ADD COLUMN IF NOT EXISTS availability text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS selling_categories text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS show_phone_to text DEFAULT 'Everyone',
ADD COLUMN IF NOT EXISTS allow_reviews boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_phone_verified boolean DEFAULT false;