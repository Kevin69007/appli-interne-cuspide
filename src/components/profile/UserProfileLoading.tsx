
import Navigation from "@/components/Navigation";

const UserProfileLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Navigation />
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg">Loading profile...</p>
      </div>
    </div>
  );
};

export default UserProfileLoading;
