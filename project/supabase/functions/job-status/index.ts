// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Function to ensure the job_status table exists
async function ensureTableExists(supabase: any) {
  try {
    // Try to create the table - this will succeed even if it already exists
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
      console.log('[JOB] Note: execute_sql RPC not available, using alternative approach');
      // If RPC doesn't work, we'll just proceed and let individual operations fail
      // The table might already exist or will be created implicitly
    }
  } catch (error) {
    console.log('[JOB] Note: Could not ensure table exists, proceeding anyway');
  }
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
        supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || supabaseKey;
      }
    } catch (envError) {
      console.log('[JOB] Environment variables not available, using defaults');
    }
    
    console.log('[JOB] Creating Supabase client with URL:', supabaseUrl);
    
    // @ts-ignore
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Ensure the table exists
    await ensureTableExists(supabase);

    const url = new URL(req.url)
    const jobId = url.searchParams.get('jobId')
    
    if (!jobId) {
      throw new Error('Job ID is required')
    }

    if (req.method === 'GET') {
      console.log(`[JOB] Retrieving status for job ${jobId}`);
      
      // Get job status from database
      const { data, error } = await supabase
        .from('job_status')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error || !data) {
        console.log(`[JOB] Job ${jobId} not found in database:`, error?.message);
        return new Response(
          JSON.stringify({
            error: 'Job not found',
            jobId
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            }
          }
        )
      }

      console.log(`[JOB] Found job ${jobId} in database with status: ${data.status}`);
      
      // Transform the database record to match the expected format
      const jobData = {
        jobId: data.job_id,
        status: data.status,
        progress: data.progress,
        message: data.message,
        result: data.result,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      return new Response(
        JSON.stringify(jobData),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      )
      
    } else if (req.method === 'POST') {
      console.log(`[JOB] Updating status for job ${jobId}`);
      
      // Update job status in database
      const updateData = await req.json()
      
      console.log(`[JOB] Update data for job ${jobId}:`, JSON.stringify(updateData));
      
      const { error } = await supabase
        .from('job_status')
        .upsert({
          job_id: jobId,
          status: updateData.status,
          progress: updateData.progress,
          message: updateData.message,
          result: updateData.result,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'job_id'
        })

      if (error) {
        console.error(`[JOB] Failed to update job ${jobId}:`, error.message);
        throw new Error(`Failed to update job status: ${error.message}`)
      }
      
      console.log(`[JOB] Updated ${jobId}: ${updateData.status} (${updateData.progress}%)`)
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      )
    }

    throw new Error('Method not allowed')

  } catch (error) {
    console.error('[JOB] Status error:', error instanceof Error ? error.message : 'Unknown error')
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )
  }
})