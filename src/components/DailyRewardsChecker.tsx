
import { useEffect, useRef } from "react";
import { useDailyRewards } from "@/hooks/useDailyRewards";

const DailyRewardsChecker = () => {
  const { checkDailyRewards, isProcessing, loading, hasClaimedToday } = useDailyRewards();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per component mount and when not already processing, loading, or already claimed
    if (!hasCheckedRef.current && !isProcessing && !loading && !hasClaimedToday) {
      console.log("🔍 DailyRewardsChecker mounted - checking for daily rewards");
      hasCheckedRef.current = true;
      
      // Small delay to ensure the app is ready, then check rewards
      const timer = setTimeout(() => {
        console.log("🎯 Processing daily rewards check...");
        checkDailyRewards().then(() => {
          console.log("✅ Daily rewards check completed");
        }).catch((error) => {
          console.error("❌ Daily rewards check failed:", error);
        });
      }, 2000); // 2 second delay to ensure everything is loaded

      return () => clearTimeout(timer);
    }
  }, [checkDailyRewards, isProcessing, loading, hasClaimedToday]); // Include all dependencies

  // Reset the check flag when component unmounts and remounts (e.g., route changes)
  useEffect(() => {
    return () => {
      hasCheckedRef.current = false;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default DailyRewardsChecker;
