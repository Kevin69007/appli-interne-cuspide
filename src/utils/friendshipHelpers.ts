
import { supabase } from "@/integrations/supabase/client";

export const checkIfUsersFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  if (!userId1 || !userId2 || userId1 === userId2) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("friendships")
      .select("id")
      .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
      .limit(1);

    if (error) {
      console.error("Error checking friendship:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking friendship:", error);
    return false;
  }
};
