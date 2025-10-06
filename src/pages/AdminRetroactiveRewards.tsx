
import Navigation from "@/components/Navigation";
import RetroactiveRewardsButton from "@/components/admin/RetroactiveRewardsButton";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminRetroactiveRewards = () => {
  const { user } = useAuth();
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/');
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      
      <main className="page-container pt-20">
        <div className="content-wrapper py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Admin: Retroactive Daily Rewards
              </h1>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-red-800">⚠️ Admin Only</h2>
                <p className="text-red-700 mt-1">
                  This action will credit all users for missed daily rewards. Use with caution.
                </p>
              </div>

              <RetroactiveRewardsButton />
              
              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">What this does:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Credits all users for 4 missed days (July 8, 9, 10, 11, 2025)</li>
                  <li>• Each user receives 4000 Paw Points total (1000 per day)</li>
                  <li>• Each user receives 4000 XP total (1000 per day)</li>
                  <li>• Care badge increases by 4 days for all users</li>
                  <li>• PawClub members receive 40 Paw Dollars total (10 per day)</li>
                  <li>• Records proper transactions for audit trail</li>
                  <li>• Prevents duplicate processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminRetroactiveRewards;
