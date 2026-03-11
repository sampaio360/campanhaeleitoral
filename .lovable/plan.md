

## Melhoria #1: Campanha + Função no Dialog de Criação de Usuário

### Problema
Ao criar um usuário em AdminUsers, apenas nome, email, senha e PIN são enviados. O usuário é criado "solto" -- sem campanha e sem função. O admin precisa fazer 2 passos manuais extras, que podem ser esquecidos.

### Solução
Adicionar dois campos ao dialog de criação:
1. **Campanha** (Select) -- pre-selecionada com a campanha ativa do admin
2. **Função** (Select) -- lista de roles disponíveis (filtrando admin/master se não for master)

### Alterações

**`src/components/admin/AdminUsers.tsx`**
- Adicionar estados `newUserRole` e `newUserCampanhaId` (pre-setado com `activeCampanhaId`)
- Adicionar dois `Select` no dialog: campanha e função
- Enviar `role` e `campanha_id` no `createUserMutation` body
- Resetar os novos campos no `resetCreateForm`

**`supabase/functions/create-user/index.ts`**
- Já aceita `role` e `campanha_id` no body -- nenhuma alteração necessária na edge function

### Resultado
Ao criar um usuário, ele já sai vinculado à campanha e com a função correta, eliminando passos manuais e risco de usuários órfãos.

