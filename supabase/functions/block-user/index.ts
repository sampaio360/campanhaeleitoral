import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is admin/master
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) throw new Error('Não autorizado')

    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    
    const isAdminOrMaster = callerRoles?.some(r => r.role === 'admin' || r.role === 'master')
    if (!isAdminOrMaster) throw new Error('Sem permissão')

    const { user_id, block } = await req.json()
    if (!user_id) throw new Error('user_id é obrigatório')

    if (block) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: '876600h' })
      if (error) throw error
      await supabaseAdmin.from('profiles').update({ blocked_at: new Date().toISOString() }).eq('id', user_id)
    } else {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: 'none' })
      if (error) throw error
      await supabaseAdmin.from('profiles').update({ blocked_at: null }).eq('id', user_id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
