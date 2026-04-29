
## Objetivo

Transformar o módulo **Inteligência Eleitoral** de um iframe único e fixo em um **catálogo de análises**: o admin cadastra várias análises (nome, descrição, link e imagem de capa) e elas aparecem automaticamente no módulo como blocos clicáveis. Ao clicar em um bloco, o sistema abre o iframe da análise selecionada (mesma experiência atual de tela cheia).

Tudo isolado por **campanha** (cada campanha vê apenas as suas) e respeitando o **controle de acesso** existente (`/inteligencia` já está no sistema de permissões por função/usuário).

---

## 1. Banco de dados (migration)

Criar tabela `inteligencia_analises`:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `campanha_id` | uuid NOT NULL | isolamento |
| `nome` | text NOT NULL | título da análise |
| `descricao` | text | subtítulo curto |
| `url` | text NOT NULL | link a ser embutido |
| `imagem_url` | text | capa do bloco |
| `ordem` | int default 0 | ordenação manual |
| `ativo` | boolean default true | esconder sem deletar |
| `created_by` | uuid | auth.uid() |
| `created_at` / `updated_at` | timestamptz | |

**RLS** (mesmo padrão de `agenda_events` / `material_inventory`):
- `Master access all` → `is_master(auth.uid())`
- `Users access own campanha` → `campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()) OR is_admin_of_campanha(auth.uid(), campanha_id) OR is_master(auth.uid())`

**Storage**: criar bucket público `inteligencia-capas` para as imagens, com policies de upload/update/delete restritas a usuários autenticados da campanha (padrão idêntico ao já usado em avatares/foto do supporter).

---

## 2. Admin: nova aba "Inteligência"

Em `src/pages/Admin.tsx`, adicionar nova tab `inteligencia` (ícone `Brain`), visível para admin/master, com rota `/admin?tab=inteligencia` (entra no `canAccess`).

Novo componente `src/components/admin/AdminInteligencia.tsx`:
- Lista das análises da campanha ativa (filtra por `useActiveCampanhaId`).
- Botão **Nova análise** abre Dialog com: nome, descrição, URL, upload de imagem de capa (AvatarUpload-like → bucket `inteligencia-capas`), ordem, switch ativo.
- Editar / Excluir / Reordenar.
- Usa React Query (`['inteligencia-analises', campanhaId]`) seguindo o padrão do projeto.

---

## 3. Página do módulo: catálogo + visualizador

Refatorar `src/pages/InteligenciaEleitoral.tsx` em duas visões controladas pela mesma rota:

**Visão A — Catálogo (default)**
- Header padrão (Navbar + título "Inteligência Eleitoral").
- Grid responsivo de cards (2/3/4 colunas, mesmo estilo visual do `DashboardModuleGrid`).
- Cada card: imagem de capa (16:9), nome, descrição curta, hover/active.
- Filtra por `useActiveCampanhaId()` + `ativo = true`.
- Empty state: "Nenhuma análise cadastrada. Peça ao administrador para adicionar em Admin → Inteligência."

**Visão B — Visualizador**
- Ao clicar num card, navegar para `/inteligencia/:id` (nova rota aninhada em `App.tsx`).
- Mesma UX atual: toolbar fina com botão **Voltar** + nome da análise + **Nova aba**, e iframe ocupando o restante (layout full-height já implementado).
- Mantém `referrerPolicy`, `allow`, fallback de bloqueio.

---

## 4. Permissões

Nada novo no schema de `access_control` — `/inteligencia` já existe. Apenas:
- Garantir que o card "Inteligência Eleitoral" no Dashboard continue respeitando `canAccess('/inteligencia')`.
- A nova subrota `/inteligencia/:id` herda automaticamente a checagem (o `useAccessControl` normaliza para o segmento pai `/inteligencia`).
- A aba "Inteligência" do Admin fica restrita a admin/master via lógica de `Admin.tsx` (igual às outras abas).

---

## 5. Arquivos afetados

**Criados**
- `supabase/migrations/<timestamp>_inteligencia_analises.sql` (tabela + RLS + bucket + policies)
- `src/components/admin/AdminInteligencia.tsx`
- `src/hooks/useInteligenciaAnalises.ts` (queries + mutations)

**Editados**
- `src/pages/InteligenciaEleitoral.tsx` (catálogo + visualizador)
- `src/App.tsx` (rota `/inteligencia/:id`)
- `src/pages/Admin.tsx` (nova tab)
- `src/lib/routeRegistry.ts` (registrar `/admin?tab=inteligencia` se necessário)

---

## Fluxo do usuário

```text
Admin → aba Inteligência → Nova análise (nome, link, imagem) → Salvar
   │
   ▼
Usuário comum da campanha → Módulos → Inteligência Eleitoral
   │
   ▼
Catálogo de cards (apenas da sua campanha)
   │  clica num card
   ▼
/inteligencia/:id → iframe da análise em tela cheia + botão Voltar
```

---

## Pontos de confirmação

1. URL do link da análise: assumirei aceitar qualquer URL `https://`. Se quiser validar domínios permitidos, me avise.
2. Imagem de capa: opcional. Se vazia, mostro um placeholder com ícone `Brain` e cor de fundo da categoria (padrão `bg-cyan-100`).
3. Ordenação: por campo `ordem` ASC, depois `created_at` DESC.

Se aprovar, implemento tudo no próximo passo.
