import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [campanha, setCampanha] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) { setError("Token inválido"); setLoading(false); return; }

      const { data, error: err } = await (supabase as any)
        .rpc("get_invite_by_token", { _token: token })
        .maybeSingle();

      if (err || !data) {
        setError("Convite não encontrado, expirado ou já utilizado.");
        setLoading(false);
        return;
      }

      const inv = data as any;
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
        setError("Este convite expirou.");
        setLoading(false);
        return;
      }

      setInvite(inv);

      // Fetch campaign name
      const { data: camp } = await supabase
        .from("campanhas")
        .select("nome, partido, municipio")
        .eq("id", inv.campanha_id)
        .maybeSingle();

      setCampanha(camp);
      setLoading(false);
    };
    fetchInvite();
  }, [token]);

  const handleRegister = async () => {
    if (!name || !email || !password || !invite) return;
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, campanha_id: invite.campanha_id } },
      });

      if (authErr) throw authErr;

      // Mark invite as used
      await (supabase.from("invite_links" as any) as any)
        .update({ used_at: new Date().toISOString(), used_by: authData.user?.id })
        .eq("id", invite.id);

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu e-mail para confirmar a conta.",
      });
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Erro no cadastro", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Convite Inválido</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => navigate("/auth")}>Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Cadastro via Convite</CardTitle>
          <CardDescription>
            {campanha ? `Campanha: ${campanha.nome}${campanha.partido ? ` — ${campanha.partido}` : ""}` : "Carregando campanha..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button onClick={handleRegister} disabled={!name || !email || !password || submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
