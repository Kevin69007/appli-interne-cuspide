
import { supabase } from "@/integrations/supabase/client";

export const cleanupDuplicatePersians = async () => {
  try {
    console.log("🧹 Starting Persian cat cleanup...");
    
    // Get all Persian cats with energy = -5
    const { data: persianCats, error: fetchError } = await supabase
      .from("user_pets")
      .select("id, pet_name, user_id, adopted_at, energy, breed")
      .eq("breed", "Persian")
      .eq("energy", -5)
      .order("adopted_at", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching Persian cats:", fetchError);
      return;
    }

    if (!persianCats || persianCats.length === 0) {
      console.log("✅ No duplicate Persian cats found");
      return;
    }

    console.log(`📊 Found ${persianCats.length} Persian cats with energy -5`);

    // Group by user and keep only the first EtherealSnailfish per user
    const usersWithPersians = new Map();
    const petsToDelete: string[] = [];

    persianCats.forEach(cat => {
      if (!usersWithPersians.has(cat.user_id)) {
        // First Persian for this user - keep it if it's EtherealSnailfish
        if (cat.pet_name === "EtherealSnailfish") {
          usersWithPersians.set(cat.user_id, cat.id);
        } else {
          // First Persian but wrong name - delete it
          petsToDelete.push(cat.id);
        }
      } else {
        // Additional Persian for this user - delete it
        petsToDelete.push(cat.id);
      }
    });

    if (petsToDelete.length === 0) {
      console.log("✅ No duplicate Persian cats to delete");
      return;
    }

    console.log(`🗑️ Deleting ${petsToDelete.length} duplicate Persian cats`);

    // Delete duplicates in batches to avoid timeout
    const batchSize = 10;
    for (let i = 0; i < petsToDelete.length; i += batchSize) {
      const batch = petsToDelete.slice(i, i + batchSize);
      const { error } = await supabase
        .from("user_pets")
        .delete()
        .in("id", batch);

      if (error) {
        console.error("❌ Error deleting Persian batch:", error);
      } else {
        console.log(`✅ Deleted batch of ${batch.length} Persian cats`);
      }
    }

    console.log("🎉 Persian cat cleanup completed");
  } catch (error) {
    console.error("❌ Persian cleanup failed:", error);
  }
};

// Auto-run the cleanup when this module is imported
cleanupDuplicatePersians();
