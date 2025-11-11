// Vercel Edge Function for Hugging Face Token Validation
// This function replicates the exact behavior of Hugging Face CLI and Python SDK

// Simple in-memory cache for validated tokens (1 hour expiration)
const tokenCache = new Map<string, { token: string; user: string; validatedAt: string; method: string }>();

// Clean up expired cache entries periodically
function cleanupCache() {
  const now = Date.now();
  // Convert Map entries to array to avoid TypeScript iteration issues
  const entries = Array.from(tokenCache.entries());
  for (const [key, value] of entries) {
    const validatedTime = new Date(value.validatedAt).getTime();
    if (now - validatedTime > 3600000) { // 1 hour in milliseconds
      tokenCache.delete(key);
    }
  }
}

// Validate Hugging Face token using CLI-like behavior
async function validateTokenWithSDKLikeBehavior(token: string): Promise<{ success: boolean; user?: string; method?: string; error?: string; status?: number }> {
  try {
    // Clean token by removing all whitespace characters (CLI-like behavior)
    const cleanToken = token.replace(/\s/g, "");
    console.log('🧹 Cleaning token, new length:', cleanToken.length);
    
    // Don't expose full token in logs, just the prefix for debugging
    console.log('👤 Token prefix for debugging:', cleanToken.substring(0, 8) + '...');

    // CLI-like behavior: Try with "Bearer" prefix first, then fallback to raw token
    console.log('🔍 Trying token with Bearer prefix (CLI behavior)...');
    let response = await fetch("https://huggingface.co/api/whoami-v2", {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${cleanToken}`,
        "User-Agent": "huggingface_hub.js/1.0 (like huggingface_hub.py/0.20.0)"
      },
    });

    let method = "Bearer";

    // If we get 401, try with raw token (CLI fallback behavior)
    if (response.status === 401) {
      console.log('🔐 401 received, trying with raw token (CLI fallback behavior)...');
      response = await fetch("https://huggingface.co/api/whoami-v2", {
        method: 'GET',
        headers: {
          "Authorization": cleanToken,
          "User-Agent": "huggingface_hub.js/1.0 (like huggingface_hub.py/0.20.0)"
        },
      });
      method = "Raw";
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
        error: errorText,
        status: response.status
      };
    }

    // Parse response JSON
    const userData = await response.json();
    
    // Validate user data
    if (!userData.name) {
      console.error('❌ User data missing name field');
      return {
        success: false,
        error: "Invalid user data received from Hugging Face API",
        status: 500
      };
    }

    console.log('✅ Token validated for user:', userData.name);
    return {
      success: true,
      user: userData.name,
      method: method
    };

  } catch (error) {
    console.error('❌ Token validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
}

export default async function handler(request: Request) {
  // Set up CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST method.",
        status: 405
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  }

  try {
    // Parse request body
    const { token, userId }: { token: string; userId: string } = await request.json();
    
    console.log('🔐 Hugging Face token validation request for user:', userId);
    
    // Validate input
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token is required",
          status: 400
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // Check if we have a cached validation for this user
    const cachedEntry = tokenCache.get(userId);
    if (cachedEntry) {
      const cleanToken = token.replace(/\s/g, "");
      // Check if the cached token matches and is still valid (1 hour)
      const validatedTime = new Date(cachedEntry.validatedAt).getTime();
      const now = Date.now();
      
      if (cachedEntry.token === cleanToken && (now - validatedTime) < 3600000) {
        console.log('✅ Using cached token validation for user:', cachedEntry.user);
        return new Response(
          JSON.stringify({
            success: true,
            user: cachedEntry.user,
            method: cachedEntry.method,
            validatedAt: cachedEntry.validatedAt
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            }
          }
        );
      } else {
        // Remove expired cache entry
        tokenCache.delete(userId);
      }
    }

    // Validate the token using SDK-like behavior
    const validationResult = await validateTokenWithSDKLikeBehavior(token);
    
    if (validationResult.success && validationResult.user) {
      // Cache the successful validation for 1 hour
      const validatedAt = new Date().toISOString();
      tokenCache.set(userId, {
        token: token.replace(/\s/g, ""),
        user: validationResult.user,
        validatedAt: validatedAt,
        method: validationResult.method || "Bearer"
      });
      console.log('💾 Token validation cached for user:', userId);
      
      return new Response(
        JSON.stringify({
          success: true,
          user: validationResult.user,
          method: validationResult.method,
          validatedAt: validatedAt
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationResult.error,
          status: validationResult.status
        }),
        {
          status: validationResult.status || 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

  } catch (error) {
    console.error('❌ Hugging Face token validation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  }
}

// Export config for Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};