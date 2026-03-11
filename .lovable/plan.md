

## Plano: Adicionar Coordenador Territorial + Reordenar Hierarquia de Campo

### Hierarquia Corrigida

**Funções de Campo** (ordem hierárquica decrescente):
1. Liderança Política — superior ao Coordenador Local (mesmo nível conceitual, mas acima)
2. Coordenador Territorial *(NOVO)*
3. Coordenador Local
4. Supervisor de Área
5. Apoiador

**Funções Internas** (escritório):
6. Assessor
7. Coordenador Geral — superior a todas exceto admin/master/candidato; sem acesso a `/admin`
8. Candidato
9. Administrador de Sistema
10. Master

### Etapas

**1. Migration SQL** — Adicionar `'territorial_coordinator'` ao enum `app_role`

**2. `src/lib/routeRegistry.ts`** — Reordenar `ALL_ROLES` e adicionar label:
```
supporter → supervisor → local_coordinator → territorial_coordinator → political_leader → assessor → coordinator → candidate → admin → master
```
Label: `territorial_coordinator: 'Coordenador Territorial'`

**3. `src/hooks/useAccessControl.ts`** — Adicionar ao `DEFAULT_DENIED`:
- `territorial_coordinator: ['/admin', '/roi']` (mesmo nível que `local_coordinator`)

**4. `src/components/admin/AdminUsers.tsx`** — Adicionar `territorial_coordinator` ao `ROLE_OPTIONS` na posição correta e ao `getRoleBadgeVariant`

**5. `src/components/admin/AdminRoleAssignment.tsx`** — Adicionar `<SelectItem>` para Coordenador Territorial, atualizar `getRoleLabel` e `getRoleBadgeVariant`

**6. `src/components/admin/AdminUserAccessControl.tsx`** — Adicionar `territorial_coordinator` ao `DEFAULT_DENIED`

**7. `src/pages/Messages.tsx`** — Adicionar `territorial_coordinator: "Coordenador Territorial"` ao `ROLE_LABELS` e `SELECTABLE_ROLES`

**8. `src/components/navigation/NavUserMenu.tsx`** — Adicionar `territorial_coordinator` e `political_leader` (faltante) ao `ROLE_LABELS`

**9. `supabase/functions/create-user/index.ts`** — Adicionar `'territorial_coordinator'` ao `VALID_ROLES`

**10. `src/integrations/supabase/types.ts`** — Será atualizado automaticamente pela migration

### Permissões Resumidas

| Papel | /admin | /roi | /budget | /expenses |
|-------|--------|------|---------|-----------|
| Apoiador | ❌ | ❌ | ❌ | ❌ |
| Supervisor | ❌ | ❌ | ✅ | ✅ |
| Coord. Local | ❌ | ❌ | ✅ | ✅ |
| **Coord. Territorial** | ❌ | ❌ | ✅ | ✅ |
| Liderança Política | ❌ | ❌ | ✅ | ✅ |
| Assessor | ❌ | ✅ | ✅ | ✅ |
| Coord. Geral | ❌ | ✅ | ✅ | ✅ |
| Candidato/Admin/Master | ✅ | ✅ | ✅ | ✅ |

**Arquivos modificados:** 8 arquivos + 1 migration SQL.

