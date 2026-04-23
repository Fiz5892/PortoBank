import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
          {/* Public portfolio by username — keep as last meaningful route before catch-all */}
          <Route path="/:username" element={<Portfolio />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
