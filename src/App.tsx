import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStores from "./pages/admin/AdminStores";
import AdminStoreAdmins from "./pages/admin/AdminStoreAdmins";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOffers from "./pages/admin/AdminOffers";
import StoreAdminDashboard from "./pages/store-admin/StoreAdminDashboard";
import StoreAdminOrders from "./pages/store-admin/StoreAdminOrders";
import StoreAdminProducts from "./pages/store-admin/StoreAdminProducts";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/stores" element={<AdminStores />} />
          <Route path="/admin/store-admins" element={<AdminStoreAdmins />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
          {/* Store Admin Routes */}
          <Route path="/store-admin" element={<StoreAdminDashboard />} />
          <Route path="/store-admin/orders" element={<StoreAdminOrders />} />
          <Route path="/store-admin/products" element={<StoreAdminProducts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
