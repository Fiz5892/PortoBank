import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index.tsx";
import Explore from "./pages/Explore.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Overview from "./pages/dashboard/Overview.tsx";
import MyPortfolio from "./pages/dashboard/MyPortfolio.tsx";
import EditProfile from "./pages/dashboard/EditProfile.tsx";
import Inbox from "./pages/dashboard/Inbox.tsx";
import DashboardSettings from "./pages/dashboard/Settings.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminPortfolios from "./pages/admin/AdminPortfolios.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminLogs from "./pages/admin/AdminLogs.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/dashboard/portfolio" element={<MyPortfolio />} />
          <Route path="/dashboard/profile" element={<EditProfile />} />
          <Route path="/dashboard/inbox" element={<Inbox />} />
          <Route path="/dashboard/settings" element={<DashboardSettings />} />
          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/portfolios" element={<AdminPortfolios />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          {/* Public portfolio by username — keep as last meaningful route before catch-all */}
          <Route path="/:username" element={<Portfolio />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
