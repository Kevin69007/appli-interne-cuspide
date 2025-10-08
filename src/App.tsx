import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import JobDocuments from "./pages/JobDocuments";
import Protocols from "./pages/Protocols";
import Quiz from "./pages/Quiz";
import ObjectifsPrimes from "./pages/ObjectifsPrimes";
import ObjectifsPrimesManager from "./pages/objectifs-primes/Manager";
import ObjectifsPrimesEmploye from "./pages/objectifs-primes/Employe";
import ObjectifsPrimesAdmin from "./pages/objectifs-primes/Admin";
import Taches from "./pages/Taches";
import CongesMoodBar from "./pages/CongesMoodBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          return status >= 500 && failureCount < 2;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/fiches-de-poste" element={<JobDocuments />} />
            <Route path="/protocoles" element={<Protocols />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/objectifs-primes" element={<ObjectifsPrimes />} />
            <Route path="/objectifs-primes/manager" element={<ObjectifsPrimesManager />} />
            <Route path="/objectifs-primes/employe" element={<ObjectifsPrimesEmploye />} />
            <Route path="/objectifs-primes/admin" element={<ObjectifsPrimesAdmin />} />
            <Route path="/taches" element={<Taches />} />
            <Route path="/conges-mood-bar" element={<CongesMoodBar />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
