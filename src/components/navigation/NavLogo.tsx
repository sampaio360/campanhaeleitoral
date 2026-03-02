import { BarChart3 } from "lucide-react";

export function NavLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
        <BarChart3 className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold">Gerencial Campanha</h1>
        <p className="text-xs text-muted-foreground">Gestão de Campanhas</p>
      </div>
    </div>
  );
}