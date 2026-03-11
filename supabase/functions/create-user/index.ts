import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin/master
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const callerId = claimsData.claims.sub;

    // Check if caller is admin or master
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    const roles = callerRoles?.map((r: any) => r.role) || [];
    const callerIsMaster = roles.includes('master');
    if (!roles.includes('admin') && !callerIsMaster) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin or master required' }), { status: 403, headers: corsHeaders });
    }

    const { email, name, password, pin, role, campanha_id } = await req.json();

    // Only master can assign admin or master roles
    if (role && (role === 'admin' || role === 'master') && !callerIsMaster) {
      return new Response(JSON.stringify({ error: 'Forbidden: only master can assign admin or master roles' }), { status: 403, headers: corsHeaders });
    }

    // Validate role is a known value
    const VALID_ROLES = ['supporter', 'political_leader', 'local_coordinator', 'territorial_coordinator', 'supervisor', 'assessor', 'coordinator', 'candidate', 'admin', 'master'];
    if (role && !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: corsHeaders });
    }

    if (!email || !name || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Email, name, and password (min 6 chars) are required' }), { status: 400, headers: corsHeaders });
    }

    if (!pin || pin.length !== 4) {
      return new Response(JSON.stringify({ error: '4-digit PIN is required' }), { status: 400, headers: corsHeaders });
    }

    // Check PIN uniqueness
    const { data: existingPin } = await adminClient
      .from('profiles')
      .select('id')
      .eq('pin', pin)
      .maybeSingle();

    if (existingPin) {
      return new Response(JSON.stringify({ error: 'PIN already in use' }), { status: 409, headers: corsHeaders });
    }

    // Create auth user with the REAL password (not PIN)
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders });
    }

    const userId = authUser.user.id;

    // Update profile with PIN and email
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ pin, email, name })
      .eq('id', userId);

    // If profile doesn't exist yet (no trigger), insert it
    if (profileError) {
      await adminClient
        .from('profiles')
        .insert({ id: userId, name, pin, email, campanha_id: (role !== 'admin' && campanha_id) ? campanha_id : null });
    } else if (campanha_id && role !== 'admin') {
      await adminClient
        .from('profiles')
        .update({ campanha_id })
        .eq('id', userId);
    }

    // For admin role, use user_campanhas junction table for multi-campaign support
    if (role === 'admin' && campanha_id) {
      await adminClient
        .from('user_campanhas')
        .insert({ user_id: userId, campanha_id });
    }

    // Assign role (one role per user - replace any existing)
    if (role) {
      await adminClient.from('user_roles').delete().eq('user_id', userId);
      await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
