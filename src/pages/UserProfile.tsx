
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import UserProfileHeader from "@/components/profile/UserProfileHeader";
import UserProfileContent from "@/components/profile/UserProfileContent";
import UserProfileLoading from "@/components/profile/UserProfileLoading";
import UserProfileError from "@/components/profile/UserProfileError";
import { useUserProfileData } from "@/hooks/useUserProfileData";

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  console.log('🔍 UserProfile component - Username from params:', username);
  
  // Validate username parameter
  if (!username || typeof username !== 'string') {
    console.log('❌ Invalid or missing username in URL params:', username);
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Navigation />
        <main className="pt-24 px-6 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Invalid Profile URL</h1>
            <p className="text-muted-foreground mb-6">
              No valid username was provided in the URL.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Decode the username to handle URL encoding
  const decodedUsername = decodeURIComponent(username);
  console.log('🔍 Decoded username:', decodedUsername);
  
  const {
    profile,
    loading,
    error,
    isAlreadyFriend,
    hasPendingRequest,
    checkingFriendStatus,
    isOwnProfile,
    user,
    handleSendFriendRequest,
    fetchUserProfile
  } = useUserProfileData(decodedUsername);

  console.log('📊 UserProfile state:', {
    username: decodedUsername,
    hasProfile: !!profile,
    loading,
    error,
    isOwnProfile,
    hasUser: !!user
  });

  if (loading) {
    console.log('⏳ Showing loading state');
    return <UserProfileLoading />;
  }

  if (error || !profile) {
    console.log('❌ Showing error state:', error);
    return (
      <UserProfileError 
        error={error || `User "${decodedUsername}" not found.`}
        username={decodedUsername}
        onRetry={fetchUserProfile}
      />
    );
  }

  // Redirect to own profile if this is the user's own profile
  if (isOwnProfile && user) {
    console.log('🔄 Redirecting to own profile');
    navigate('/profile', { replace: true });
    return <UserProfileLoading />;
  }

  console.log('✅ Rendering user profile for:', profile.username);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      {/* Fixed background pattern that won't jump */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }} 
      />
      
      <Navigation />
      <main className="pt-24 px-6 max-w-6xl mx-auto relative z-10 pb-20">
        <div className="space-y-6">
          <UserProfileHeader
            isOwnProfile={isOwnProfile}
            user={user}
            profile={profile}
            isAlreadyFriend={isAlreadyFriend}
            hasPendingRequest={hasPendingRequest}
            checkingFriendStatus={checkingFriendStatus}
            onSendFriendRequest={handleSendFriendRequest}
          />
          
          <UserProfileContent
            profile={profile}
            isOwnProfile={isOwnProfile}
            onProfileUpdate={fetchUserProfile}
          />
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
