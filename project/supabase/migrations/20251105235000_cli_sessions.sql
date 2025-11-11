/* 
# Create cli_sessions table for CLI-Web integration

1. New Tables
  - `cli_sessions`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `device_id` (text, not null)
    - `pairing_code` (text, not null, unique)
    - `huggingface_token` (text)
    - `verified` (boolean, default false)
    - `expires_at` (timestamp)
    - `created_at` (timestamp)

2. Security
  - Enable RLS on `cli_sessions` table
  - Add policy for authenticated users to manage their own sessions

3. Indexes
  - Add index on pairing_code for fast lookups
  - Add index on user_id for user queries
*/

CREATE TABLE IF NOT EXISTS public.cli_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id text NOT NULL,
    pairing_code text NOT NULL UNIQUE,
    huggingface_token text,
    verified boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.cli_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CLI sessions"
ON public.cli_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CLI sessions"
ON public.cli_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CLI sessions"
ON public.cli_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_cli_sessions_pairing_code ON public.cli_sessions(pairing_code);
CREATE INDEX idx_cli_sessions_user_id ON public.cli_sessions(user_id);