

## Etapa 1: Padronizar Resolucao de `campanhaId`

### Problema
7 paginas usam `campanhaId` direto do perfil, ignorando `selectedCampanhaId`. Para admins sem `campanha_id` no perfil (ex: Neemias), tudo quebra. Outras 4 paginas usam `isMaster ? (selected || campanha) : campanha`, o que exclui admins.

### Padrao Correto
```text
const activeCampanhaId = selectedCampanhaId || campanhaId;
```
Isso funciona para todos: usuarios normais (selectedCampanhaId e null, usa campanhaId), admins e masters (usa selectedCampanhaId).

### Alteracoes por Arquivo

**1. `src/pages/Expenses.tsx`**
- Linha 46: adicionar `selectedCampanhaId` ao destructuring do `useAuth()`
- Adicionar: `const activeCampanhaId = selectedCampanhaId || campanhaId;`
- Substituir todas as referencias a `campanhaId` por `activeCampanhaId` (linhas 63, 70, 92, 99)
- Remover import nao usado `CardDescription` (linha 2)

**2. `src/pages/Reports.tsx`**
- Linha 39: adicionar `selectedCampanhaId` ao destructuring
- Adicionar `activeCampanhaId` e substituir `campanhaId` nas queries (linhas 66, 73, 75, 77, 79)

**3. `src/pages/DossieVisita.tsx`**
- Linha 36: adicionar `selectedCampanhaId` ao destructuring
- Adicionar `activeCampanhaId` e substituir nas queries (linhas 42, 51, 64)

**4. `src/pages/ROI.tsx`**
- Linha 20: adicionar `selectedCampanhaId`
- Adicionar `activeCampanhaId` e substituir (linhas 28, 32, 33, 34)

**5. `src/pages/RouteAssignment.tsx`**
- Linha 45: adicionar `selectedCampanhaId`
- Adicionar `activeCampanhaId` e substituir (linhas 68, 72-74)

**6. `src/pages/Messages.tsx`**
- Linha 27: adicionar `selectedCampanhaId`
- Adicionar `activeCampanhaId` e substituir (linhas 36, 42, 53, 57)

**7. `src/pages/Agenda.tsx`**
- Linha 86: corrigir de `campanhaId || ((isMaster || isAdmin) ? selectedCampanhaId : null)` para `selectedCampanhaId || campanhaId`

**8. `src/pages/Supporters.tsx`**
- Linha 25: corrigir de `isMaster ? (selectedCampanhaId || campanhaId) : campanhaId` para `selectedCampanhaId || campanhaId`

**9. `src/components/supporters/SupporterForm.tsx`**
- Linha 89: mesma correcao

**10. `src/components/admin/AdminExternalForm.tsx`**
- Linha 35: mesma correcao

**11. `src/components/admin/AdminUserCampanhas.tsx`**
- Linha 19: mesma correcao

### Impacto
- Corrige 7 paginas completamente quebradas para admins sem `campanha_id` no perfil
- Unifica 4 padroes diferentes em 1 unico padrao consistente
- Zero risco de regressao: para usuarios com `campanhaId` e sem `selectedCampanhaId`, o comportamento e identico

