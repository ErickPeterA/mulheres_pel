import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import WelcomeProfileModal from "@/components/WelcomeProfileModal";
import Index from "./pages/Index";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import MyProfile from "./pages/MyProfile";
import UserProfile from "./pages/UserProfile";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WelcomeProfileModal />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/aguardando-aprovacao" element={<PendingApproval />} />
            <Route
              path="/meu-perfil"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil/:code"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil/u/:userId"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/:id"
              element={
                <ProtectedRoute>
                  <ProfessionalProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
