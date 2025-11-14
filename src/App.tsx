import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect } from "react";
import "@/locales";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import JobDocuments from "./pages/JobDocuments";
import Protocols from "./pages/Protocols";
import Quiz from "./pages/Quiz";
import IndicateursPrimes from "./pages/IndicateursPrimes";
import IndicateursPrimesEmploye from "./pages/indicateurs-primes/Employe";
import IndicateursPrimesAdmin from "./pages/indicateurs-primes/Admin";
import CommunicationGenerale from "./pages/CommunicationGenerale";
import Taches from "./pages/Taches";
import CongesMoodBar from "./pages/CongesMoodBar";
import Agenda from "./pages/Agenda";
import Logs from "./pages/Logs";
import Detente from "./pages/Detente";
import DetenteTest from "./pages/DetenteTest";

import EntretiensMachines from "./pages/EntretiensMachines";
import CommandesStock from "./pages/CommandesStock";
import Formation from "./pages/Formation";
import SuiviDirection from "./pages/SuiviDirection";
import Projets from "./pages/Projets";
import ProjetDetails from "./pages/ProjetDetails";
import Reunions from "./pages/Reunions";
import ReunionDetails from "./pages/ReunionDetails";
import AdminReunions from "./pages/reunions/Admin";
import CalendrierProjets from "./pages/CalendrierProjets";

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

const App = () => {
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      import('i18next').then((i18n) => {
        i18n.default.changeLanguage(savedLang);
      });
    }
  }, []);

  return (
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
            <Route path="/indicateurs-primes" element={<IndicateursPrimes />} />
            <Route path="/indicateurs-primes/employe" element={<IndicateursPrimesEmploye />} />
            <Route path="/indicateurs-primes/admin" element={<IndicateursPrimesAdmin />} />
            {/* Backwards compatibility */}
            <Route path="/objectifs-primes" element={<IndicateursPrimes />} />
            <Route path="/objectifs-primes/employe" element={<IndicateursPrimesEmploye />} />
            <Route path="/objectifs-primes/admin" element={<IndicateursPrimesAdmin />} />
            <Route path="/communication-generale" element={<CommunicationGenerale />} />
            <Route path="/taches" element={<Taches />} />
            <Route path="/conges-mood-bar" element={<CongesMoodBar />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/detente" element={<Detente />} />
            <Route path="/detente-test" element={<DetenteTest />} />
            <Route path="/entretiens-machines" element={<EntretiensMachines />} />
            <Route path="/commandes-stock" element={<CommandesStock />} />
            <Route path="/formation" element={<Formation />} />
          <Route path="/suivi-direction" element={<SuiviDirection />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/projets/:id" element={<ProjetDetails />} />
          <Route path="/reunions" element={<Reunions />} />
          <Route path="/reunions/:id" element={<ReunionDetails />} />
          <Route path="/reunions/admin" element={<AdminReunions />} />
          <Route path="/calendrier-projets" element={<CalendrierProjets />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
