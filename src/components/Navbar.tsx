import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { getOfflineQueueCount } from "@/lib/offlineSync";
import {
  NavLogo,
  NavLinks,
  NavNotifications,
  NavUserMenu,
  NavMobileMenu,
} from "./navigation/index";
import { NavActiveCampaign } from "./navigation/NavActiveCampaign";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [offlineCount, setOfflineCount] = useState(getOfflineQueueCount());

  useEffect(() => {
    const handler = () => setOfflineCount(getOfflineQueueCount());
    window.addEventListener("offline-queue-changed", handler);
    return () => window.removeEventListener("offline-queue-changed", handler);
  }, []);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-6">
          <NavLogo />
          {user && <NavLinks />}
          {user && <NavActiveCampaign />}
        </div>
        <div className="flex items-center gap-2">
          {offlineCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> {offlineCount} pendente{offlineCount > 1 ? "s" : ""}
            </span>
          )}
          {user ? (
            <>
              <NavNotifications />
              <NavUserMenu user={user} onSignOut={signOut} />
              <NavMobileMenu />
            </>
          ) : (
            <Button variant="campaign" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
