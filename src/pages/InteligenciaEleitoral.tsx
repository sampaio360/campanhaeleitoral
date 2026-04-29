import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, AlertCircle, Brain, ArrowLeft, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useInteligenciaAnalises,
  useInteligenciaAnalise,
} from "@/hooks/useInteligenciaAnalises";

function Viewer({ id, fullscreen }: { id: string; fullscreen: boolean }) {
  const navigate = useNavigate();
  const { data: analise, isLoading } = useInteligenciaAnalise(id);
  const [blocked, setBlocked] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!analise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <p className="font-medium">Análise não encontrada</p>
        <Button onClick={() => navigate("/inteligencia")}>Voltar ao catálogo</Button>
      </div>
    );
  }

  // Fullscreen: sem Navbar, iframe ocupa 100vh, toolbar mínima flutuante
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate("/inteligencia")}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
            </Button>
            <span className="text-sm font-semibold truncate">{analise.nome}</span>
          </div>
        </div>
        {blocked ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className="font-medium">Não foi possível carregar o conteúdo embutido</p>
            <Button asChild>
              <a href={analise.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Abrir no navegador
              </a>
            </Button>
          </div>
        ) : (
          <iframe
            src={analise.url}
            title={analise.nome}
            className="flex-1 w-full border-0 block"
            onError={() => setBlocked(true)}
            referrerPolicy="no-referrer"
            allow="geolocation; clipboard-read; clipboard-write"
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate("/inteligencia")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
          </Button>
          <span className="text-sm font-semibold truncate">{analise.nome}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7" onClick={() => navigate(`/inteligencia/${id}/full`)}>
          <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
          Tela cheia
        </Button>
      </div>
      {blocked ? (
        <div className="flex flex-col items-center justify-center gap-3 text-center p-6 min-h-[60vh]">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <p className="font-medium">Não foi possível carregar o conteúdo embutido</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Este site não permite ser exibido dentro de outra página. Tente abrir em tela cheia.
          </p>
          <Button onClick={() => navigate(`/inteligencia/${id}/full`)}>
            <Maximize2 className="w-4 h-4 mr-2" />
            Abrir em tela cheia
          </Button>
        </div>
      ) : (
        <iframe
          src={analise.url}
          title={analise.nome}
          className="w-full border-0 block"
          style={{ height: "6000px" }}
          scrolling="no"
          onError={() => setBlocked(true)}
          referrerPolicy="no-referrer"
          allow="geolocation; clipboard-read; clipboard-write"
        />
      )}
    </div>
  );
}

function Catalog() {
  const navigate = useNavigate();
  const { data: analises, isLoading } = useInteligenciaAnalises({ onlyActive: true });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-700" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Inteligência Eleitoral</h1>
            <p className="text-sm text-muted-foreground">Análises e dashboards externos da campanha</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 animate-spin inline text-muted-foreground" />
          </div>
        ) : !analises || analises.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Nenhuma análise cadastrada ainda.<br />
              Peça ao administrador para adicioná-las em <strong>Admin → Inteligência</strong>.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {analises.map((a) => (
              <Card
                key={a.id}
                onClick={() => navigate(`/inteligencia/${a.id}`)}
                className={cn(
                  "cursor-pointer overflow-hidden border-0 transition-all hover:shadow-lg active:scale-[0.98] hover:scale-[1.02]"
                )}
              >
                <div className="aspect-video bg-cyan-100 relative overflow-hidden">
                  {a.imagem_url ? (
                    <img
                      src={a.imagem_url}
                      alt={a.nome}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Brain className="w-10 h-10 text-cyan-700/60" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1">{a.nome}</h3>
                  {a.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.descricao}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const InteligenciaEleitoral = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const fullscreen = location.pathname.endsWith("/full");
  return id ? <Viewer id={id} fullscreen={fullscreen} /> : <Catalog />;
};

export default InteligenciaEleitoral;
