
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PetSale {
  user_pet_id: string;
  price_nd: number;
  is_active: boolean;
  seller_id: string;
}

export const usePetSales = (profileUserId?: string) => {
  const { user } = useAuth();
  const [petSales, setPetSales] = useState<Map<string, PetSale>>(new Map());

  const fetchPetSales = async () => {
    // If viewing another user's profile, fetch their pet sales
    // If viewing own profile or no specific user, fetch own sales
    const targetUserId = profileUserId || user?.id;
    
    if (!targetUserId) return;
    
    try {
      const { data: salesData, error } = await supabase
        .from("pet_sales")
        .select("user_pet_id, price_nd, is_active, seller_id")
        .eq("seller_id", targetUserId)
        .eq("is_active", true);

      if (error) throw error;

      const salesMap = new Map<string, PetSale>();
      salesData?.forEach(sale => {
        salesMap.set(sale.user_pet_id.toString(), sale);
      });
      setPetSales(salesMap);
    } catch (error) {
      console.error("Error fetching pet sales:", error);
    }
  };

  useEffect(() => {
    const targetUserId = profileUserId || user?.id;
    if (targetUserId) {
      fetchPetSales();
    }
  }, [user, profileUserId]);

  return { petSales, fetchPetSales };
};
