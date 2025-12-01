import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  photo_url?: string;
  email?: string;
  equipe?: string;
  groupe?: string;
}

interface EmployeeContextType {
  employee: Employee | null;
  loading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType>({
  employee: null,
  loading: true,
});

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['current-employee', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('employees')
        .select('id, nom, prenom, photo_url, email, equipe, groupe')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Cache 10 minutes
  });

  return (
    <EmployeeContext.Provider value={{ employee: employee || null, loading: isLoading }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
};
