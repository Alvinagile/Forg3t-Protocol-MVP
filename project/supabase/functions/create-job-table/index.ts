// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Create a Supabase client
    let supabaseUrl = 'https://xewxfsdrtqpthkpbhbzp.supabase.co';
    let supabaseKey = '';
    
    // Try to get environment variables
    try {
      // @ts-ignore
      if (typeof Deno !== 'undefined' && Deno.env) {
        // @ts-ignore
        supabaseUrl = Deno.env.get('SUPABASE_URL') || supabaseUrl;
        // @ts-ignore
        supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      }
    } catch (envError) {
      console.log('[CREATE-TABLE] Environment variables not available, using defaults');
    }
    
    console.log('[CREATE-TABLE] Creating Supabase client with URL:', supabaseUrl);
    
    // @ts-ignore
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Create the job_status table
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS job_status (
          job_id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          progress INTEGER,
          message TEXT,
          result JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_job_status_updated_at ON job_status(updated_at);
      `
    });

    if (error) {
      console.error('[CREATE-TABLE] Failed to create table:', error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      )
    }

    console.log('[CREATE-TABLE] Table created successfully');
    
    return new Response(
      JSON.stringify({ success: true, message: 'Table created successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )

  } catch (error) {
    console.error('[CREATE-TABLE] Error:', error instanceof Error ? error.message : 'Unknown error')
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )
  }
})