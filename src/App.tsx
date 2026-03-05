// App root component with providers and routing
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DossieVisita from "./pages/DossieVisita";
import Dashboard from "./pages/Dashboard";
import Budget from "./pages/Budget";
import Expenses from "./pages/Expenses";
import Supporters from "./pages/Supporters";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import StreetCheckin from "./pages/StreetCheckin";
import Resources from "./pages/Resources";
import RouteAssignment from "./pages/RouteAssignment";
import Messages from "./pages/Messages";
import ROI from "./pages/ROI";
import Invite from "./pages/Invite";
import Modulos from "./pages/Modulos";
import Municipios from "./pages/Municipios";
import Audit from "./pages/Audit";
import Agenda from "./pages/Agenda";
import Install from "./pages/Install";
import Profile from "./pages/Profile";
import ExternalRegister from "./pages/ExternalRegister";
import ExternalDataCollection from "./pages/ExternalDataCollection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/historico" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
            <Route path="/convite/:token" element={<Invite />} />
            <Route path="/cadastro/:token" element={<ExternalRegister />} />
            <Route path="/coleta/:token" element={<ExternalDataCollection />} />
            <Route path="/install" element={<Install />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
