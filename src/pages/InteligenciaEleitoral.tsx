import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";

// TODO: substituir pela URL real do site de Inteligência Eleitoral
const EXTERNAL_URL = "https://example.com";

const InteligenciaEleitoral = () => {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Inteligência Eleitoral</h1>
            <p className="text-sm text-muted-foreground">
              Plataforma externa integrada ao sistema
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={EXTERNAL_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em nova aba
            </a>
          </Button>
        </div>

        <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card relative min-h-[70vh]">
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
              className="w-full h-full min-h-[70vh] border-0"
              onError={() => setBlocked(true)}
              referrerPolicy="no-referrer"
              allow="geolocation; clipboard-read; clipboard-write"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InteligenciaEleitoral;
