import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Lock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PinGateProps {
  onSuccess: () => void;
}

export const PinGate = ({ onSuccess }: PinGateProps) => {
  const { toast } = useToast();
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (value: string) => {
    if (value.length !== 4) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("validate_pin", { p_pin: value });

      if (error || !data) {
        toast({ title: "PIN inválido", description: "O PIN digitado está incorreto.", variant: "destructive" });
        setPin("");
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem("pin_verified", "true");
      onSuccess();
    } catch {
      toast({ title: "Erro", description: "Erro ao validar PIN.", variant: "destructive" });
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = profile?.name || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-9 h-9 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Sessão protegida</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-3 mb-2">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{displayName}</CardTitle>
                <CardDescription>
                  Digite seu PIN de 4 dígitos para continuar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validando...</p>
              </div>
            ) : (
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={(value) => {
                  setPin(value);
                  if (value.length === 4) handlePinComplete(value);
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-2xl font-bold" />
                  <InputOTPSlot index={1} className="w-14 h-14 text-2xl font-bold" />
                  <InputOTPSlot index={2} className="w-14 h-14 text-2xl font-bold" />
                  <InputOTPSlot index={3} className="w-14 h-14 text-2xl font-bold" />
                </InputOTPGroup>
              </InputOTP>
            )}
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={async () => {
            sessionStorage.removeItem("pin_verified");
            localStorage.removeItem("device_token");
            await signOut();
            navigate("/auth", { replace: true });
          }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 mx-auto"
        >
          <LogOut className="w-4 h-4" />
          Trocar de usuário
        </button>
      </div>
    </div>
  );
};
