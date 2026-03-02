import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const Municipios = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Municípios</h1>
          <p className="text-sm text-muted-foreground">Gerencie os municípios da campanha</p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Módulo de Municípios</h3>
            <p className="text-muted-foreground">
              Em breve você poderá cadastrar e gerenciar os municípios atendidos pela campanha.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Municipios;
