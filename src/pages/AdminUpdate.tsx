
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import UpdateBreedIcon from "@/components/admin/UpdateBreedIcon";
import UpdateBreedIcons from "@/components/admin/UpdateBreedIcons";

const AdminUpdate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-pink-800 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access admin features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      <div className="absolute inset-0 opacity-5 bg-repeat" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
      
      <Navigation />
      <main className="pt-24 px-6 max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-pink-800 mb-4">Admin Updates</h1>
          <p className="text-xl text-muted-foreground">Manage breed icons and other admin tasks</p>
        </div>

        <div className="space-y-8">
          <UpdateBreedIcon />
          <UpdateBreedIcons />
        </div>
      </main>
    </div>
  );
};

export default AdminUpdate;
