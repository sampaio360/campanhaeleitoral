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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { token, nome, email, password, pin, telefone, cpf, funcao_politica, endereco, bairro, cidade, estado, cep } = body;

    // Validate required fields
    if (!token || !nome || !email || !password || !pin) {
      return new Response(JSON.stringify({ error: 'Token, nome, email, senha e PIN são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN deve ter exatamente 4 dígitos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate invite token
    const { data: invite, error: inviteErr } = await adminClient
      .from('invite_links')
      .select('campanha_id')
      .eq('token', token)
      .is('used_at', null)
      .maybeSingle();

    if (inviteErr || !invite) {
      return new Response(JSON.stringify({ error: 'Link inválido ou expirado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const campanha_id = invite.campanha_id;

    // Check external form is enabled for this campaign
    const { data: formConfig } = await adminClient
      .from('external_form_config')
      .select('enabled')
      .eq('campanha_id', campanha_id)
      .eq('enabled', true)
      .maybeSingle();

    if (!formConfig) {
      return new Response(JSON.stringify({ error: 'Formulário externo não habilitado para esta campanha' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check PIN uniqueness
    const { data: existingPin } = await adminClient
      .from('profiles')
      .select('id')
      .eq('pin', pin)
      .maybeSingle();

    if (existingPin) {
      return new Response(JSON.stringify({ error: 'Este PIN já está em uso. Escolha outro.' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: nome },
    });

    if (authError) {
      const msg = authError.message.includes('already been registered')
        ? 'Este email já está cadastrado no sistema.'
        : authError.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authUser.user.id;

    // Create/update profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ pin, email, name: nome, campanha_id })
      .eq('id', userId);

    if (profileError) {
      await adminClient
        .from('profiles')
        .insert({ id: userId, name: nome, pin, email, campanha_id });
    }

    // Assign supporter role
    await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role: 'supporter' });

    // Create supporter record
    const { data: supporter } = await adminClient
      .from('supporters')
      .insert({
        campanha_id,
        nome,
        telefone: telefone || null,
        email: email || null,
        endereco: endereco || null,
        bairro: bairro || null,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        cpf: cpf || null,
        funcao_politica: funcao_politica || null,
      })
      .select('id')
      .single();

    // Link supporter to profile
    if (supporter) {
      await adminClient
        .from('profiles')
        .update({ supporter_id: supporter.id })
        .eq('id', userId);
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
