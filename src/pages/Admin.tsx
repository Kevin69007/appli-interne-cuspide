
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminValidation } from "@/hooks/useAdminValidation";
import CreateOddStatPet from "@/components/admin/CreateOddStatPet";
import FixOverStatPets from "@/components/admin/FixOverStatPets";
import TestDailyRewardsButton from "@/components/admin/TestDailyRewardsButton";
import ManualDailyRewardsButton from "@/components/admin/ManualDailyRewardsButton";
import UpdateBreedIcon from "@/components/admin/UpdateBreedIcon";
import UpdateBreedIcons from "@/components/admin/UpdateBreedIcons";
import { fixAllOverStatPets, fixOverStatBabies } from "@/utils/fixOverStatPets";

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin, loading } = useAdminValidation();

  // Auto-fix functionality on page load
  useEffect(() => {
    if (isAdmin && !loading) {
      const runAutoFix = async () => {
        console.log("🔧 Running automatic over-stat pet fix...");
        
        try {
          const petResult = await fixAllOverStatPets();
          if (petResult.success && petResult.fixedCount > 0) {
            toast({
              title: "Auto-Fix Complete",
              description: `Fixed ${petResult.fixedCount} over-stat pets automatically`,
            });
          }

          const babyResult = await fixOverStatBabies();
          if (babyResult.success && babyResult.fixedCount > 0) {
            toast({
              title: "Auto-Fix Complete", 
              description: `Fixed ${babyResult.fixedCount} over-stat babies automatically`,
            });
          }

          if (petResult.success && babyResult.success && petResult.fixedCount === 0 && babyResult.fixedCount === 0) {
            console.log("✅ Database is clean - no over-stat pets or babies found");
          }
        } catch (error) {
          console.error("❌ Auto-fix failed:", error);
        }
      };

      runAutoFix();
    }
  }, [isAdmin, loading, toast]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">🛠️ Admin Control Panel</h1>
        
        <div className="space-y-8">
          {/* DAILY REWARDS SECTION */}
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-green-800 mb-2">🎁 Daily Rewards Management</h2>
              <p className="text-green-600">Monitor and control the daily rewards system</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TestDailyRewardsButton />
              <ManualDailyRewardsButton />
            </div>
            
            <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                📋 <strong>Instructions:</strong> First test the system status, then trigger rewards if needed.
              </p>
              <p className="text-green-700 font-semibold mt-2">
                ✅ <strong>Note:</strong> Retroactive rewards for July 14th, 2025 have been successfully processed via SQL migration.
              </p>
            </div>
          </div>

          {/* PET MANAGEMENT SECTION */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-purple-800 mb-2">🐕 Pet Management Tools</h2>
              <p className="text-purple-600">Create and manage pets in the system</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CreateOddStatPet />
              <FixOverStatPets />
            </div>
          </div>

          {/* BREED ICON SECTION */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-blue-800 mb-2">🖼️ Breed Icon Management</h2>
              <p className="text-blue-600">Upload and manage breed icons</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UpdateBreedIcon />
              <UpdateBreedIcons />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
