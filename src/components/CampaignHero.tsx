import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Shield, 
  BarChart3 
} from "lucide-react";
import heroImage from "@/assets/campaign-hero.webp";

export function CampaignHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 sm:py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="outline" className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary text-primary-foreground border-0">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Plataforma de Gestão de Campanhas
          </Badge>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Gerencie sua{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Campanha Política
            </span>{" "}
            com Transparência
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Centralize análises de votos históricos, controle orçamentário, gestão de equipe 
            e relatórios detalhados em uma única plataforma segura e profissional.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
            <Button variant="hero" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
              <Users className="w-5 h-5 mr-2" />
              Acessar Plataforma
            </Button>
            <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
              <BarChart3 className="w-5 h-5 mr-2" />
              Ver Demonstração
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-16">
            <div className="p-6 rounded-xl bg-card shadow-card transition-smooth hover:shadow-elevated">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Análise de Dados</h3>
              <p className="text-sm text-muted-foreground">
                Visualize dados eleitorais históricos e tendências de votação
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card shadow-card transition-smooth hover:shadow-elevated">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-success-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Gestão Financeira</h3>
              <p className="text-sm text-muted-foreground">
                Controle total do orçamento e execução financeira da campanha
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card shadow-card transition-smooth hover:shadow-elevated">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Colaboração</h3>
              <p className="text-sm text-muted-foreground">
                Trabalhe em equipe com apoiadores e controle de permissões
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}