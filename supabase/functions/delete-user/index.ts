import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify, createRemoteJWKSet } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - no token' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Extract user ID from the JWT using the admin client
    const token = authHeader.replace('Bearer ', '');
    
    // Use admin client to get user from token
    const { data: { user: callerUser }, error: userError } = await adminClient.auth.admin.getUserById(
      // First decode the JWT to get the sub claim
      JSON.parse(atob(token.split('.')[1])).sub
    );
    
    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid user' }), { status: 401, headers: corsHeaders });
    }

    const callerId = callerUser.id;

    // Check if caller is master
    const { data: callerRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    const roles = callerRoles?.map((r: any) => r.role) || [];
    if (!roles.includes('master')) {
      return new Response(JSON.stringify({ error: 'Forbidden: master role required' }), { status: 403, headers: corsHeaders });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400, headers: corsHeaders });
    }

    if (user_id === callerId) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400, headers: corsHeaders });
    }

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
