// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface CliAuthRequest {
  userId: string;
}

interface CliAuthResponse {
  success: boolean;
  user?: string;
  error?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { userId }: CliAuthRequest = await req.json()
    
    console.log('🔐 CLI auth request for user:', userId)
    
    // Validate input
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing userId"
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

    // In a real implementation, you would:
    // 1. Generate a pairing code
    // 2. Store it in a database with expiration time
    // 3. Associate it with the user ID
    // 4. Return the pairing code to the client
    
    // For now, we'll simulate this behavior
    console.log('📝 In production, this would generate a pairing code and store it in the database')
    
    // Simulate successful auth
    const pairingCode = 'FORG3T-' + Math.floor(1000 + Math.random() * 9000);
    
    return new Response(
      JSON.stringify({
        success: true,
        pairingCode: pairingCode,
        message: `Run 'forg3t link ${pairingCode}' in your terminal to connect your CLI session.`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )

  } catch (error) {
    console.error('❌ CLI auth error:', error)
    
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