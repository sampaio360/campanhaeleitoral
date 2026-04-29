import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";

const EXTERNAL_URL = "https://bahiaeleicao-dn3whwu7.manus.space/";

const InteligenciaEleitoral = () => {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
        <h1 className="text-sm font-semibold">Inteligência Eleitoral</h1>
        <Button variant="ghost" size="sm" asChild className="h-7">
          <a href={EXTERNAL_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Nova aba
          </a>
        </Button>
      </div>
      <div className="flex-1 relative bg-card">
        {blocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className="font-medium">Não foi possível carregar o conteúdo embutido</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Este site não permite ser exibido dentro de outra página. Use o botão abaixo para abrir em nova aba.
            </p>
            <Button asChild>
              <a href={EXTERNAL_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir agora
              </a>
            </Button>
          </div>
        ) : (
          <iframe
            src={EXTERNAL_URL}
            title="Inteligência Eleitoral"
            className="w-full h-full border-0 block"
            onError={() => setBlocked(true)}
            referrerPolicy="no-referrer"
            allow="geolocation; clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
};

export default InteligenciaEleitoral;
