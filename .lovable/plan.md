

## Ajuste: Vincular campanhas com checkboxes

### Problema atual
A coluna "Campanha" na tabela de usuarios usa um Select dropdown que so permite escolher UMA campanha principal (`profiles.campanha_id`). As campanhas extras via `user_campanhas` aparecem como badges mas nao tem interface intuitiva para gerenciar.

### Solucao
Substituir o popover com Select por um popover com **lista de checkboxes** mostrando todas as campanhas disponiveis. Marcar/desmarcar adiciona ou remove registros na tabela `user_campanhas` e define a primeira campanha marcada como `profiles.campanha_id`.

### Alteracoes em `src/components/admin/AdminUsers.tsx`

1. **Substituir o popover de "Campanha principal"** (linhas 542-567) por um popover com checkboxes:
   - Lista todas as campanhas com `Checkbox` ao lado do nome
   - Checked = usuario participa (existe em `user_campanhas` OU `profiles.campanha_id`)
   - Ao marcar: insere em `user_campanhas` e se nao tem `campanha_id` no profile, seta como principal
   - Ao desmarcar: remove de `user_campanhas` e se era a `campanha_id` do profile, limpa

2. **Criar mutation `toggleCampaignMutation`** que:
   - Se marcando: faz `insert` em `user_campanhas` + `update profiles.campanha_id` se vazio
   - Se desmarcando: faz `delete` de `user_campanhas` + limpa `profiles.campanha_id` se era essa

3. **Manter a logica `getUserCampanhas`** ja existente para exibir os badges

### Resultado
Interface clara onde o admin ve todas as campanhas como checkboxes e marca/desmarca para vincular o usuario, sem ambiguidade.

