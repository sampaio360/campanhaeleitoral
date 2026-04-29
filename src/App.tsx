// App root component with providers and routing
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useCampaignTheme } from "@/hooks/useCampaignTheme";

// Eager: landing + auth (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy: all protected/secondary routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Budget = lazy(() => import("./pages/Budget"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Supporters = lazy(() => import("./pages/Supporters"));
const Reports = lazy(() => import("./pages/Reports"));
const Admin = lazy(() => import("./pages/Admin"));
const StreetCheckin = lazy(() => import("./pages/StreetCheckin"));
const Resources = lazy(() => import("./pages/Resources"));
const RouteAssignment = lazy(() => import("./pages/RouteAssignment"));
const Messages = lazy(() => import("./pages/Messages"));
const ROI = lazy(() => import("./pages/ROI"));
const Modulos = lazy(() => import("./pages/Modulos"));
const Municipios = lazy(() => import("./pages/Municipios"));
const Audit = lazy(() => import("./pages/Audit"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Profile = lazy(() => import("./pages/Profile"));
const DossieVisita = lazy(() => import("./pages/DossieVisita"));
const Invite = lazy(() => import("./pages/Invite"));
const ExternalRegister = lazy(() => import("./pages/ExternalRegister"));
const ExternalDataCollection = lazy(() => import("./pages/ExternalDataCollection"));
const Install = lazy(() => import("./pages/Install"));
const InteligenciaEleitoral = lazy(() => import("./pages/InteligenciaEleitoral"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RoutesFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}

function AppContent() {
  useCampaignTheme();
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RoutesFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/select-candidate" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dossie/:cidade" element={<ProtectedRoute><DossieVisita /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/supporters" element={<ProtectedRoute><Supporters /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><StreetCheckin /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/roteiro" element={<ProtectedRoute><RouteAssignment /></ProtectedRoute>} />
            <Route path="/mensagens" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/roi" element={<ProtectedRoute><ROI /></ProtectedRoute>} />
            <Route path="/modulos" element={<ProtectedRoute><Modulos /></ProtectedRoute>} />
            <Route path="/municipios" element={<ProtectedRoute><Municipios /></ProtectedRoute>} />
            <Route path="/inteligencia" element={<ProtectedRoute><InteligenciaEleitoral /></ProtectedRoute>} />
            <Route path="/inteligencia/:id" element={<ProtectedRoute><InteligenciaEleitoral /></ProtectedRoute>} />
            <Route path="/inteligencia/:id/full" element={<ProtectedRoute><InteligenciaEleitoral /></ProtectedRoute>} />
            <Route path="/historico" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
            <Route path="/convite/:token" element={<Invite />} />
            <Route path="/cadastro/:token" element={<ExternalRegister />} />
            <Route path="/coleta/:token" element={<ExternalDataCollection />} />
            <Route path="/install" element={<Install />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
