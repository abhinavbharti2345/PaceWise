import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

// Restrict CORS to the deployed app origin.
// Falls back to '*' only when APP_ORIGIN is not set (local development).
const appOrigin = Deno.env.get('APP_ORIGIN') ?? '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': appOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // 1. Create a Supabase Admin client using the service-role key.
    //    SUPABASE_SERVICE_ROLE_KEY exists ONLY in the Deno server environment —
    //    it is NEVER sent to or accessible from the browser.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 2. Validate the JWT from the Authorization header to identify the caller.
    //    We NEVER trust a user_id from the request body — identity comes from the token only.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or malformed Authorization header.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired authentication token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 3. Delete the Supabase Auth user using the verified user ID from the JWT.
    //    This permanently removes the account from auth.users.
    //    Application data (profiles, transactions, people, budget_configs) should
    //    be deleted by the frontend BEFORE calling this function, or via DB CASCADE.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      // Log full error server-side; return a safe generic message to the client.
      console.error('[delete-user] Admin deleteUser failed:', deleteError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete account. Please try again or contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 4. Return a minimal success response — no sensitive info.
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    // Log full error server-side only.
    console.error('[delete-user] Unexpected error:', error instanceof Error ? error.message : error);

    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred. Please try again.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
