import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
// Pages en lazy-loading : chaque route devient un chunk séparé (chargé à la demande).
// → la landing ne télécharge plus toute l'app (dashboards, admin, recharts…), d'où un FCP/LCP bien plus rapide.
const Index = lazy(() => import("./pages/Index"));
const LandingEcommerce = lazy(() => import("./pages/LandingEcommerce"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardBocuse = lazy(() => import("./pages/DashboardBocuse"));
const DashboardLabarile = lazy(() => import("./pages/DashboardLabarile"));
const DashboardRichissime = lazy(() => import("./pages/DashboardRichissime"));
const DashboardCwpPl2025 = lazy(() => import("./pages/DashboardCwpPl2025"));
const DashboardNowmade = lazy(() => import("./pages/DashboardNowmade"));
const DashboardPrimeCircle = lazy(() => import("./pages/DashboardPrimeCircle"));
const DashboardPrimeCircleAgency = lazy(() => import("./pages/DashboardPrimeCircleAgency"));
const DashboardDigit = lazy(() => import("./pages/DashboardDigit"));
const DashboardDigitCore = lazy(() => import("./pages/DashboardDigitCore"));
const DashboardSpy = lazy(() => import("./pages/DashboardSpy"));
const DashboardComment = lazy(() => import("./pages/DashboardComment"));
const DashboardPCGroup = lazy(() => import("./pages/DashboardPCGroup"));
const DashboardNexus = lazy(() => import("./pages/DashboardNexus"));
const DashboardHotelX = lazy(() => import("./pages/DashboardHotelX"));
const DashboardSkalis = lazy(() => import("./pages/DashboardSkalis"));
const DashboardAmpfora = lazy(() => import("./pages/DashboardAmpfora"));
const CompanyForm = lazy(() => import("./pages/CompanyForm"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminPCGroupDiagnostics = lazy(() => import("./pages/AdminPCGroupDiagnostics"));
const AdminPCGroupEntities = lazy(() => import("./pages/AdminPCGroupEntities"));
const AdminEntityInputs = lazy(() => import("./pages/AdminEntityInputs"));
const AdminDataSources = lazy(() => import("./pages/AdminDataSources"));
const AdminCsvImport = lazy(() => import("./pages/AdminCsvImport"));
const AdminLabarileImport = lazy(() => import("./pages/AdminLabarileImport"));
const AdminDataroomUpload = lazy(() => import("./pages/AdminDataroomUpload"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminClientCockpit = lazy(() => import("./pages/admin/AdminClientCockpit"));
const AdminClientSettings = lazy(() => import("./pages/admin/AdminClientSettings"));
const AdminAdvisors = lazy(() => import("./pages/admin/AdminAdvisors"));
const AdminActivities = lazy(() => import("./pages/admin/AdminActivities"));
const AdminCatalog = lazy(() => import("./pages/admin/AdminCatalog"));
const ClientSpace = lazy(() => import("./pages/ClientSpace"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/ecommerce" element={<LandingEcommerce />} />
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
            <Route path="/" element={<Index />} />
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
              path="/dashboard-digit-core/:id" 
              element={
                <ProtectedRoute>
                  <DashboardDigitCore />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-spy/:id" 
              element={
                <ProtectedRoute>
                  <DashboardSpy />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard-comment/:id" 
              element={
                <ProtectedRoute>
                  <DashboardComment />
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
              path="/dashboard-ampfora/:id" 
              element={
                <ProtectedRoute>
                  <DashboardAmpfora />
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
            <Route
              path="/admin/data-sources"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminDataSources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/csv-import"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminCsvImport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/labarile-import"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminLabarileImport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dataroom-upload"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminDataroomUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminClients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients/:id"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminClientCockpit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients/:id/settings"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminClientSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/advisors"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminAdvisors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activities"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminActivities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activities/:id"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/:id"
              element={
                <ProtectedRoute>
                  <ClientSpace />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
