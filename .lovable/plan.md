

## Plan: Fix campaign selector trigger label

**Problem**: Line 139-141 in `NavUserMenu.tsx` shows the active campaign's `nome` (e.g., "SIMULADA") when a campaign is selected. The correct behavior, as shown in the screenshot, is to always display "Selecione uma campanha" as the trigger text.

**Fix in `src/components/navigation/NavUserMenu.tsx`** (lines 138-142):

Change from:
```tsx
<span className="truncate">
  {activeCampanhaId
    ? campanhas.find(c => c.id === activeCampanhaId)?.nome || "Campanha"
    : "Selecione uma campanha"}
</span>
```

To:
```tsx
<span className="truncate">Selecione uma campanha</span>
```

The active campaign is already indicated by the checkmark (✓) next to the selected item in the submenu, and the navbar badge (`NavActiveCampaign`) shows which campaign is active. The trigger label should remain static.

