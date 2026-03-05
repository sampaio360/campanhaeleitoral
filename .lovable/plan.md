

## Plano: Ajustes de Visibilidade no Admin

### 1. Aba "Campanhas" visivel apenas para Master

**Arquivo:** `src/pages/Admin.tsx`

Adicionar uma propriedade `masterOnly: true` na definicao da tab "campanhas" e filtrar no `visibleTabs` usando `isMaster` do `useAuth()`. Admins nao verao essa aba.

### 2. Aba "Usuarios" -- Admin ve apenas usuarios da campanha ativa

O `AdminUsers.tsx` ja possui logica de filtragem por campanha para admins (`filteredUsers`). Porem, usa `adminCampaignIds` (todas as campanhas do admin) em vez da campanha **ativa** (`selectedCampanhaId || campanhaId`). Corrigir para filtrar apenas pela campanha ativa, usando `useActiveCampanhaId()`.

**Arquivo:** `src/components/admin/AdminUsers.tsx`
- Importar `useActiveCampanhaId`
- No `filteredUsers`, filtrar por `activeCampanhaId` em vez de todas as campanhas do admin

### 3. Aba "Permissoes" -- Admin so ve/atribui funcoes a usuarios da campanha ativa

**Arquivo:** `src/components/admin/AdminRoleAssignment.tsx`

Atualmente, busca todos os profiles e todos os user_roles sem filtro de campanha. Corrigir:

- Importar `useActiveCampanhaId`
- Buscar `user_campanhas` para a campanha ativa e cruzar com profiles, mostrando apenas usuarios vinculados a essa campanha
- Filtrar a listagem de `userRoles` para exibir apenas roles de usuarios da campanha ativa
- No dropdown de "Atribuir Funcao", listar apenas profiles da campanha ativa

