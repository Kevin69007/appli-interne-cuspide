
import Navigation from "@/components/Navigation";
import { isPromotionActive } from "@/utils/discountUtils";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

const ProfileLayout = ({ children }: ProfileLayoutProps) => {
  const showPromoBanner = isPromotionActive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      {/* Fixed background pattern */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }} 
      />
      
      <Navigation />
      
      {/* Use new spacing classes */}
      <main className={showPromoBanner ? "page-with-nav-and-banner" : "page-with-nav"}>
        <div className="content-wrapper py-6 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ProfileLayout;
