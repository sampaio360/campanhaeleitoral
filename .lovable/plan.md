## Objetivo

Reestruturar o módulo **Inteligência Eleitoral** para que:

1. Apenas o **Master** cadastre análises (admins de campanha não veem mais a aba).
2. Cada análise possa ser vinculada a **uma ou mais campanhas** (N:N).
3. Usuários só vejam análises vinculadas à campanha ativa **e** com permissão `/inteligencia` liberada para sua função/usuário.
4. A linha "Inteligência Eleitoral" no controle de permissões só apareça para o Master configurar (admin comum não enxerga).

---

## 1. Banco de dados

**Mudança estrutural**: trocar o `campanha_id` único da tabela `inteligencia_analises` por uma tabela de junção.

```text
inteligencia_analises (1) ───< inteligencia_analise_campanhas >─── (1) campanhas
```

Migração:

- Criar `public.inteligencia_analise_campanhas`:
  - `analise_id uuid NOT NULL` (FK lógica → `inteligencia_analises.id`, ON DELETE CASCADE via trigger ou cascade simples)
  - `campanha_id uuid NOT NULL`
  - `created_at timestamptz default now()`
  - PK composta `(analise_id, campanha_id)`
  - índice em `campanha_id`
- Backfill: para cada análise existente, inserir 1 linha na nova tabela com o `campanha_id` atual.
- Remover coluna `campanha_id` de `inteligencia_analises` (após backfill).
- Atualizar RLS de `inteligencia_analises`:
  - DROP das policies atuais (que usam `campanha_id`).
  - **SELECT**: liberado se o usuário pertence a alguma das campanhas vinculadas (via subquery na tabela de junção) **OU** é Master.
  - **INSERT/UPDATE/DELETE**: somente Master (`is_master(auth.uid())`).
- RLS da nova `inteligencia_analise_campanhas`:
  - **SELECT**: usuário da campanha vinculada **OU** Master.
  - **INSERT/UPDATE/DELETE**: somente Master.
- Bucket `inteligencia-capas` permanece igual (upload restrito a autenticado já existe; ajustar para Master apenas no upload, mas mantém leitura pública).

---

## 2. Hooks (`src/hooks/useInteligenciaAnalises.ts`)

- `useInteligenciaAnalises` (catálogo do usuário): JOIN com `inteligencia_analise_campanhas` filtrando pela campanha ativa; retorna apenas `ativo = true`.
- `useInteligenciaAnalisesAdmin` (Master): lista todas + array de `campanha_ids` vinculadas, sem filtro de campanha.
- `useInteligenciaAnalise(id)`: garante checagem de vínculo com a campanha ativa antes de renderizar viewer (RLS já bloqueia, mas tratamos UX de "não encontrada").
- `useUpsertInteligenciaAnalise`: aceita `campanha_ids: string[]` no payload; ao salvar, faz upsert da análise e re-sincroniza a tabela de junção (delete + insert das vinculadas) numa única mutation.
- Permissão: hook só executa mutações se `isMaster` (verificação client + RLS server).

---

## 3. Admin: aba "Inteligência" (somente Master)

`src/pages/Admin.tsx`:

- Marcar a tab `inteligencia` como `masterOnly: true` (igual `campanhas`). Admin comum não verá mais a aba.

`src/components/admin/AdminInteligencia.tsx`:

- Mostrar **todas** as análises do sistema (não filtra por campanha ativa).
- Coluna nova: **"Campanhas"** com badges dos nomes vinculados (ex: "Campanha A, Campanha B").
- No dialog de criar/editar, adicionar um seletor **multi-select de campanhas** (lista todas as `campanhas` ativas) — campo obrigatório (mínimo 1).
- Validação: bloquear submit se nenhuma campanha selecionada.

---

## 4. Controle de permissão (`/inteligencia`)

`src/components/admin/AdminAccessControl.tsx` e `AdminUserAccessControl.tsx`:

- Hoje listam todas as rotas de `routeRegistry`. Vamos marcar a rota `/inteligencia` como **`masterOnly: true`** no `routeRegistry.ts`.
- Filtrar a lista renderizada: se `route.masterOnly && !isMaster`, esconder a linha. Assim, admin comum não vê nem configura a permissão de Inteligência — quem decide acesso é o Master, mas a função/usuário ainda controla quem **abre** o módulo dentro da campanha.

Resultado: o Master habilita a permissão para uma função (ex: "Coordenador") e vincula a análise X à Campanha Y. Um coordenador da Campanha Y verá a análise X; um coordenador da Campanha Z não verá.

---

## 5. Página do módulo (`InteligenciaEleitoral.tsx`)

Sem mudança visual:

- O `useInteligenciaAnalises` já retornará apenas as análises da campanha ativa (via novo JOIN).
- A checagem de permissão `/inteligencia` já é feita pelo `ProtectedRoute` + `useAccessControl`.
- Empty state atualiza texto: "Nenhuma análise disponível para esta campanha."

---

## 6. Fluxo final

```text
MASTER  →  Admin → Inteligência → Nova análise
              │   nome, URL, imagem, ordem, ativo
              │   campanhas vinculadas: [Campanha A, Campanha B]  ← novo
              ▼
         inteligencia_analises  +  inteligencia_analise_campanhas

USUÁRIO da Campanha A com permissão /inteligencia
              │
              ▼
         Catálogo mostra a análise
              │
              ▼
         Tela cheia (já implementada)

USUÁRIO da Campanha C ou sem permissão → não vê o módulo / catálogo vazio
```

---

## Arquivos afetados

**Migration nova**
- `supabase/migrations/<ts>_inteligencia_n_to_n.sql` (cria junção, backfill, drop coluna, novas RLS)

**Editados**
- `src/hooks/useInteligenciaAnalises.ts` (queries + mutations N:N)
- `src/components/admin/AdminInteligencia.tsx` (multi-select de campanhas, lista global)
- `src/pages/Admin.tsx` (`masterOnly: true` na aba Inteligência)
- `src/lib/routeRegistry.ts` (marcar `/inteligencia` como `masterOnly`)
- `src/components/admin/AdminAccessControl.tsx` (esconder rotas masterOnly de não-Masters)
- `src/components/admin/AdminUserAccessControl.tsx` (mesmo filtro)
- `src/pages/InteligenciaEleitoral.tsx` (apenas ajuste de texto do empty state)

---

## Pontos de confirmação

1. **Campanhas no formulário**: multi-select com checkboxes (lista todas ativas). OK?
2. **Master "vê tudo"**: o Master, mesmo sem campanha ativa, vê **todas** as análises no Admin. No catálogo do módulo (`/inteligencia`), Master vê só as da campanha ativa atual (igual qualquer outra). OK?
3. **Backfill**: análises hoje cadastradas serão automaticamente vinculadas à campanha em que foram criadas — nada se perde.
