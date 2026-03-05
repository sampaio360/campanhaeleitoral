

## Avaliacao e Plano: Isolamento por Campanha Ativa

### Situacao Atual

**O que ja funciona:**
- Admin/Master com **1 campanha**: auto-selecionada no login (OK)
- Admin/Master com **multiplas campanhas**: seletor disponivel no menu do usuario (submenu)
- **11 modulos** ja usam `useActiveCampanhaId()` ou `selectedCampanhaId || campanhaId` corretamente

**Problemas identificados (2 categorias):**

#### Problema 1: Tela de selecao obrigatoria inexistente
Admins com multiplas campanhas entram no sistema **sem campanha selecionada**. Os dados ficam vazios ou mostram tudo misturado ate que o admin va manualmente no menu do usuario e escolha. Nao ha uma tela bloqueante pedindo a selecao.

#### Problema 2: 8 modulos ignoram `selectedCampanhaId`
Usam `campanhaId` direto do perfil, entao mesmo que o admin selecione outra campanha no menu, esses modulos continuam mostrando dados da campanha do perfil (ou nada, se o perfil nao tiver `campanha_id`).

| # | Modulo | Arquivo | Problema |
|---|--------|---------|----------|
| 1 | Orcamentos | `useBudgetData.ts` | Usa `campanhaId` do perfil |
| 2 | Receitas | `BudgetRevenues.tsx` | Idem |
| 3 | Despesas (Financeiro) | `BudgetExpenses.tsx` | Idem |
| 4 | Recursos | `Resources.tsx` | Idem |
| 5 | Inventario | `MaterialInventory.tsx` | Idem |
| 6 | Dashboard Data | `useDashboardData.ts` | So resolve para Master, exclui Admin |
| 7 | Dashboard Alertas | `useDashboardAlerts.ts` | Idem |
| 8 | Auditoria | `Audit.tsx` | Idem |

---

### Plano de Correcao

#### Parte 1: Tela bloqueante de selecao de campanha

Criar um componente `CampaignGate` que intercepta no `ProtectedRoute`. Se o usuario for admin/master, nao tiver `campanha_id` no perfil, e `selectedCampanhaId` estiver vazio, exibe uma tela de selecao obrigatoria antes de permitir acesso ao sistema.

- Arquivo: `src/components/CampaignGate.tsx` (novo)
- Integrar em: `src/components/ProtectedRoute.tsx` (apos PinGate)
- Exibe lista de campanhas vinculadas (admin via `user_campanhas`, master via todas)
- Ao selecionar, chama `setSelectedCampanhaId` e o sistema continua

#### Parte 2: Corrigir os 8 modulos com isolamento quebrado

Substituir `campanhaId` de `useAuth()` por `useActiveCampanhaId()` em todos os 8 arquivos:

1. **`useBudgetData.ts`** -- trocar `campanhaId` por `useActiveCampanhaId()`
2. **`BudgetRevenues.tsx`** -- idem
3. **`BudgetExpenses.tsx`** -- idem
4. **`Resources.tsx`** -- idem
5. **`MaterialInventory.tsx`** -- idem
6. **`useDashboardData.ts`** -- trocar logica `isMaster && override` por `overrideCampanhaId || profileCampanhaId`
7. **`useDashboardAlerts.ts`** -- idem
8. **`Audit.tsx`** -- trocar por `selectedCampanhaId || profileCampanhaId`

Todas as substituicoes seguem o padrao ja consolidado nos 11 modulos que funcionam. Para usuarios comuns (sem `selectedCampanhaId`), o comportamento e identico ao atual.

