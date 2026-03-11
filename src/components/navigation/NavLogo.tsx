import logoIcon from "@/assets/logo-icon.png";

export function NavLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logoIcon} alt="Gerencial Campanha" className="w-9 h-9 rounded-lg" />
      <div className="hidden sm:block">
        <h1 className="text-base font-bold leading-tight">Gerencial Campanha</h1>
        <p className="text-[10px] text-muted-foreground leading-none">Gestão de Campanhas</p>
      </div>
    </div>
  );
}