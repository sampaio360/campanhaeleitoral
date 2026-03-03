

# Avaliacao e Plano: Controle de Acesso por Funcao + por Usuario

## Situacao Atual

Hoje o `access_control` tem granularidade apenas por **funcao (role)** + **rota** + **campanha**. Isso significa:
- Se o Candidato tem acesso ao `/budget`, **todos** os candidatos daquela campanha tem acesso
- Nao ha como restringir um usuario especifico sem mudar a regra para todos do mesmo cargo

## O que falta

Um controle **por usuario individual** que funcione como override sobre a regra por funcao. Exemplo pratico:
- Regra por funcao: Candidato pode acessar `/budget` -> SIM
- Override por usuario: Candidato "Joao" nao pode acessar `/budget` -> BLOQUEADO

Isso permite reduzir o excesso de informacao para usuarios especificos sem afetar os demais.

## Plano de Implementacao

### 1. Nova tabela `user_access_control`

```sql
CREATE TABLE public.user_access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, user_id, route)
);
```

Com RLS similar ao `access_control` (Master full, Admin gerencia suas campanhas).

### 2. Logica de resolucao de acesso (useAccessControl.ts)

Prioridade de avaliacao:

```text
1. Master -> acesso total (bypass)
2. user_access_control (regra por usuario) -> se existe, e a resposta final
3. access_control (regra por funcao) -> se existe, aplica
4. DEFAULT_DENIED -> fallback padrao
```

O override por usuario sempre vence a regra por funcao.

### 3. Nova aba na UI: "Controle por Usuario"

Dentro da aba **Permissoes**, adicionar uma terceira sub-aba alem de "Atribuir Funcao" e "Controle de Acesso":
- **Controle por Usuario**: Seleciona um usuario especifico e configura quais rotas ele pode/nao pode acessar, independente da funcao

A interface seria:
- Select de usuario (filtrado pela campanha ativa)
- Mesma lista de rotas do ROUTE_REGISTRY
- Checkboxes: marcado = permitido, desmarcado = bloqueado, sem regra = herda da funcao (estado intermediario)

### 4. Alteracoes em arquivos

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Criar tabela `user_access_control` + RLS |
| `useAccessControl.ts` | Buscar `user_access_control` para o user atual, aplicar prioridade |
| `AdminPermissions.tsx` | Adicionar terceira aba "Por Usuario" |
| Novo: `AdminUserAccessControl.tsx` | Componente da matriz por usuario |

### 5. Hierarquia de escopos resumida

```text
Admin       -> ve/gerencia tudo das campanhas vinculadas
Candidato   -> escopo global da campanha (restringivel por usuario)
Coord Geral -> escopo global da campanha (restringivel por usuario)
Supervisor  -> escopo global (restringivel)
Coord Local -> escopo restrito por padrao
Lideranca   -> escopo restrito por padrao
Apoiador    -> escopo minimo por padrao
```

A diferenca entre "escopo global" e "restrito por padrao" e definida pelo `DEFAULT_DENIED` + regras de `access_control`. O novo `user_access_control` permite ajuste fino individual em qualquer nivel.

