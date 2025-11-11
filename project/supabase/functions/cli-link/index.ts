// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface CliLinkRequest {
  pairing_code: string;
  device_id: string;
  huggingface_token: string;
}

interface CliLinkResponse {
  success: boolean;
  user_id?: string;
  device_linked?: boolean;
  error?: string;
}

async function validateTokenWithSDKLikeBehavior(token: string): Promise<{ success: boolean; user?: string; error?: string }> {
  try {
    const cleanToken = token.replace(/\s/g, "");
    console.log('🧹 Cleaning token, new length:', cleanToken.length);
    console.log('👤 Token prefix for debugging:', cleanToken.substring(0, 8) + '...');

    console.log('🔍 Trying token with Bearer prefix (SDK behavior)...');
    let response = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: {
        "Authorization": `Bearer ${cleanToken}`,
        "User-Agent": "huggingface_hub.js/1.0 (like huggingface_hub.py/0.20.0)"
      },
    });

    if (response.status === 401) {
      console.log('🔐 401 received, trying with raw token (SDK fallback behavior)...');
      response = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: {
          "Authorization": cleanToken,
          "User-Agent": "huggingface_hub.js/1.0 (like huggingface_hub.py/0.20.0)"
        },
      });
    }

    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `HTTP ${response.status}`;
      }
      
      console.error('❌ Token validation failed:', response.status, errorText);
      return {
        success: false,
        error: errorText
      };
    }

    const userData = await response.json();
    
    if (!userData.name) {
      console.error('❌ User data missing name field');
      return {
        success: false,
        error: "Invalid user data received from Hugging Face API"
      };
    }

    console.log('✅ Token validated for user:', userData.name);
    return {
      success: true,
      user: userData.name
    };

  } catch (error) {
    console.error('❌ Token validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
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
    const { pairing_code, device_id, huggingface_token }: CliLinkRequest = await req.json()
    
    console.log('🔐 CLI link request for device:', device_id)
    
    if (!pairing_code || !device_id || !huggingface_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: pairing_code, device_id, or huggingface_token"
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

    const validationResult = await validateTokenWithSDKLikeBehavior(huggingface_token);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationResult.error
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      )
    }

    console.log('🔗 Linking device to user account...')
    console.log('📝 In production, this would update the cli_sessions table')
    
    const userId = 'user_' + Date.now();
    
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        device_linked: true
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )

  } catch (error) {
    console.error('❌ CLI link error:', error)
    
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