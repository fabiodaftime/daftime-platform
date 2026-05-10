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
import DashboardNowmade from "./pages/DashboardNowmade";
import DashboardPrimeCircle from "./pages/DashboardPrimeCircle";
import DashboardPrimeCircleAgency from "./pages/DashboardPrimeCircleAgency";
import DashboardDigit from "./pages/DashboardDigit";
import DashboardPCGroup from "./pages/DashboardPCGroup";
import DashboardNexus from "./pages/DashboardNexus";
import DashboardHotelX from "./pages/DashboardHotelX";
import DashboardSkalis from "./pages/DashboardSkalis";
import CompanyForm from "./pages/CompanyForm";
import AdminUsers from "./pages/AdminUsers";
import AdminPCGroupDiagnostics from "./pages/AdminPCGroupDiagnostics";
import AdminPCGroupEntities from "./pages/AdminPCGroupEntities";
import AdminEntityInputs from "./pages/AdminEntityInputs";
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
              path="/dashboard-nowmade/:id" 
              element={
                <ProtectedRoute>
                  <DashboardNowmade />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-prime-circle/:id" 
              element={
                <ProtectedRoute>
                  <DashboardPrimeCircle />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-prime-circle-agency/:id" 
              element={
                <ProtectedRoute>
                  <DashboardPrimeCircleAgency />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-digit/:id" 
              element={
                <ProtectedRoute>
                  <DashboardDigit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-pc-group/:id" 
              element={
                <ProtectedRoute>
                  <DashboardPCGroup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-nexus/:id" 
              element={
                <ProtectedRoute>
                  <DashboardNexus />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-hotel-x/:id" 
              element={
                <ProtectedRoute>
                  <DashboardHotelX />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-skalis/:id" 
              element={
                <ProtectedRoute>
                  <DashboardSkalis />
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
            <Route
              path="/admin/pcgroup-diagnostics"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminPCGroupDiagnostics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pcgroup-entities"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminPCGroupEntities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/entity-inputs"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminEntityInputs />
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
