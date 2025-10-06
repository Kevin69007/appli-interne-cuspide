import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Auth from "./pages/Auth";
import PetProfile from "./pages/PetProfile";
import PetProfilePage from "./pages/PetProfilePage";
import PetDetail from "./pages/PetDetail";
import Forums from "./pages/Forums";
import ForumDetail from "./pages/ForumDetail";
import Play from "./pages/Play";
import Bank from "./pages/Bank";
import Shop from "./pages/Shop";
import Breeding from "./pages/Breeding";
import Shelter from "./pages/Shelter";
import AdminUpdate from "./pages/AdminUpdate";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import PetSale from "./pages/PetSale";
import CreateCustomPet from "./pages/CreateCustomPet";
import CreatePersianCat from "./pages/CreatePersianCat";
import SecurityAudit from "./pages/SecurityAudit";
import NotFound from "./pages/NotFound";
import DailyRewardsChecker from "./components/DailyRewardsChecker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          return status >= 500 && failureCount < 2;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Component to handle scroll-to-top on route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <DailyRewardsChecker />
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<UserProfile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pet/:petNumber" element={<PetProfilePage />} />
                <Route path="/petdetail/:petId" element={<PetDetail />} />
                <Route path="/forums" element={<Forums />} />
                <Route path="/forums/:forumId" element={<ForumDetail />} />
                <Route path="/forums/:forumId/:postId" element={<ForumDetail />} />
                <Route path="/play" element={<Play />} />
                <Route path="/bank" element={<Bank />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/breeding" element={<Breeding />} />
                <Route path="/shelter" element={<Shelter />} />
                <Route path="/admin" element={<AdminUpdate />} />
                <Route path="/security-audit" element={<SecurityAudit />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/support" element={<Support />} />
                <Route path="/sale/:secretLink" element={<PetSale />} />
                <Route path="/create-custom-pet" element={<CreateCustomPet />} />
                <Route path="/create-persian-cat" element={<CreatePersianCat />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
