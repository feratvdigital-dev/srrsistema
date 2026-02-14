import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { TechnicianProvider } from "@/contexts/TechnicianContext";
import AppLayout from "./components/AppLayout";

// Lazy load pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewOrder = lazy(() => import("./pages/NewOrder"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Technicians = lazy(() => import("./pages/Technicians"));
const Reports = lazy(() => import("./pages/Reports"));
const Expenses = lazy(() => import("./pages/Expenses"));
const ClientRequest = lazy(() => import("./pages/ClientRequest"));
const TicketsGrid = lazy(() => import("./pages/TicketsGrid"));
const OrdersMap = lazy(() => import("./pages/OrdersMap"));
const TrackTicket = lazy(() => import("./pages/TrackTicket"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <OrderProvider>
          <TechnicianProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/request" element={<ClientRequest />} />
                  <Route path="/track" element={<TrackTicket />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/orders/new" element={<NewOrder />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/technicians" element={<Technicians />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/tickets" element={<TicketsGrid />} />
                    <Route path="/map" element={<OrdersMap />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TechnicianProvider>
        </OrderProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
