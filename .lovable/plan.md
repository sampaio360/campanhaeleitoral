

## Fix: Stale cache no preview

### Causa raiz
O dominio real do preview e `id-preview--xxx.lovable.app`, mas o codigo em `main.tsx` so verifica `lovableproject.com`. O service worker nunca e desregistrado no preview, causando cache stale.

### Correcao em `src/main.tsx`

Adicionar `lovable.app` na verificacao de host:

```typescript
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");
```

Alem disso, limpar os caches do browser junto com o unregister do SW para garantir que nenhum conteudo stale persista:

```typescript
if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
}
```

### Resultado
O SW sera desregistrado e todos os caches limpos quando rodar em qualquer dominio de preview do Lovable, eliminando o problema de versao antiga.

