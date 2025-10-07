import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const ObjectifsPrimes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!roleLoading && role) {
      if (role === "admin") {
        navigate("/objectifs-primes/admin");
      } else if (role === "manager") {
        navigate("/objectifs-primes/manager");
      } else {
        navigate("/objectifs-primes/employe");
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
};

export default ObjectifsPrimes;
