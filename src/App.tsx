import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { TechnicianProvider } from "@/contexts/TechnicianContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import OrderDetail from "./pages/OrderDetail";
import Technicians from "./pages/Technicians";
import Reports from "./pages/Reports";
import ClientRequest from "./pages/ClientRequest";
import TicketsGrid from "./pages/TicketsGrid";
import OrdersMap from "./pages/OrdersMap";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <OrderProvider>
          <TechnicianProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/request" element={<ClientRequest />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/orders/new" element={<NewOrder />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/technicians" element={<Technicians />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/tickets" element={<TicketsGrid />} />
                  <Route path="/map" element={<OrdersMap />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TechnicianProvider>
        </OrderProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
