import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import RoutesPage from "./pages/Routes";
import Customers from "./pages/Customers";
import Trips from "./pages/Trips";
import Dispatch from "./pages/Dispatch";
import Expenses from "./pages/Expenses";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Fail fast
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent aggressive refetching
      // timeout: 15000, // Removed as it is not a valid option
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ErrorBoundary name="Main Content">
                      <Outlet />
                    </ErrorBoundary>
                  </AppLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
