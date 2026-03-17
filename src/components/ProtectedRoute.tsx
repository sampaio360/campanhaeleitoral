import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { PinGate } from "@/components/PinGate";
import { CampaignGate } from "@/components/CampaignGate";
import { useToast } from "@/hooks/use-toast";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isMaster, campanhaId, selectedCampanhaId, allowedCampanhaCount } = useAuth();
  const { canAccess, isLoading: accessLoading } = useAccessControl();
  const location = useLocation();
  const { toast } = useToast();
  const [pinVerified, setPinVerified] = useState(
    () => sessionStorage.getItem("pin_verified") === "true"
  );

  if (loading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">Validando credenciais...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!pinVerified) {
    return <PinGate onSuccess={() => setPinVerified(true)} />;
  }

  // Campaign gate: admin/master with multiple campaigns and no selection
  const needsCampaignGate = (isAdmin || isMaster) && !selectedCampanhaId && allowedCampanhaCount > 1;
  if (needsCampaignGate) {
    return <CampaignGate onSelected={() => {}} />;
  }

  // Check access control for current route
  const currentPath = location.pathname;
  // Skip access check for /modulos to prevent infinite redirects
  if (currentPath !== "/modulos" && !canAccess(currentPath)) {
    return <Navigate to="/modulos" replace />;
  }

  return <>{children}</>;
};
