-- Create the pricing_requests table
CREATE TABLE IF NOT EXISTS public.pricing_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    company_email text NOT NULL,
    job_title text NOT NULL,
    company text NOT NULL,
    country text NOT NULL,
    phone_number text,
    package_interest text,
    company_size text,
    message text NOT NULL,
    consent boolean NOT NULL DEFAULT false,
    source_page text,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    user_agent text,
    ip_address inet,
    status text NOT NULL DEFAULT 'new', -- new, contacted, qualified, unqualified
    ai_context text,
    notes text
);

-- Ensure columns exist if table was created before the enterprise update
ALTER TABLE public.pricing_requests ADD COLUMN IF NOT EXISTS ai_context text;

-- Create indexes
CREATE INDEX IF NOT EXISTS pricing_requests_created_at_idx ON public.pricing_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS pricing_requests_company_email_idx ON public.pricing_requests (company_email);
CREATE INDEX IF NOT EXISTS pricing_requests_company_idx ON public.pricing_requests (company);
CREATE INDEX IF NOT EXISTS pricing_requests_status_idx ON public.pricing_requests (status);

-- Enable RLS
ALTER TABLE public.pricing_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert a pricing request
DROP POLICY IF EXISTS "Allow public insert pricing_requests" ON public.pricing_requests;
CREATE POLICY "Allow public insert pricing_requests" 
ON public.pricing_requests 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Restrict selection and updates to service role and authenticated admins
DROP POLICY IF EXISTS "Allow authenticated read pricing_requests" ON public.pricing_requests;
CREATE POLICY "Allow authenticated read pricing_requests" 
ON public.pricing_requests 
FOR SELECT 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@forg3t.io');
