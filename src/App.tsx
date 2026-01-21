import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import DashboardBocuse from "./pages/DashboardBocuse";
import DashboardLabarile from "./pages/DashboardLabarile";
import DashboardRichissime from "./pages/DashboardRichissime";
import DashboardCwpPl2025 from "./pages/DashboardCwpPl2025";
import CompanyForm from "./pages/CompanyForm";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/update-password" element={<UpdatePassword />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/:id" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-bocuse/:id" 
              element={
                <ProtectedRoute>
                  <DashboardBocuse />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-labarile/:id" 
              element={
                <ProtectedRoute>
                  <DashboardLabarile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-richissime/:id" 
              element={
                <ProtectedRoute>
                  <DashboardRichissime />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-cwp-pl-2025/:id" 
              element={
                <ProtectedRoute>
                  <DashboardCwpPl2025 />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/company/:id" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <CompanyForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminUsers />
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
