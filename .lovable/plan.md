

## Etapa 1 — Corrigir violacao de Hook no ProtectedRoute

### Problema
Em `ProtectedRoute.tsx` linha 44, `useAuth()` e chamado uma segunda vez **depois** de retornos condicionais (`if (!user) return ...`, `if (!pinVerified) return ...`). Isso viola as regras de Hooks do React — hooks devem ser chamados sempre na mesma ordem, nunca apos condicionais com `return`.

### Correcao
Mover a desestruturacao de `allowedCampanhaCount` para usar o mesmo `useAuth()` ja chamado no topo do componente (linha 17). Basta adicionar `allowedCampanhaCount` na desestruturacao existente e remover a segunda chamada na linha 44.

### Mudanca concreta
**`src/components/ProtectedRoute.tsx`**
- Linha 17: adicionar `allowedCampanhaCount` na desestruturacao existente de `useAuth()`
- Linhas 44-45: remover a segunda chamada `const { allowedCampanhaCount } = useAuth()` e usar a variavel ja disponivel

Nenhuma outra alteracao. Etapa cirurgica, zero risco de efeito colateral.

