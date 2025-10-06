
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  paw_dollars: number;
  paw_points: number;
  food_bags: number;
  pawclub_member: boolean | null;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  console.log("AuthProvider - Current state:", { 
    user: user?.id, 
    hasSession: !!session, 
    hasProfile: !!profile, 
    loading, 
    initialized,
    sessionValid: session ? session.expires_at > Math.floor(Date.now() / 1000) : false
  });

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      console.log("Profile fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      console.log("No user available for profile refresh");
      return;
    }
    
    console.log("Refreshing profile for user:", user.id);
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase sign out error:", error);
      } else {
        console.log("Supabase sign out completed successfully");
      }
      
    } catch (error) {
      console.error("Error during sign out:", error);
      // Ensure local state is cleared even if there's an error
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const isSessionValid = (currentSession: Session | null) => {
    if (!currentSession) return false;
    const now = Math.floor(Date.now() / 1000);
    return currentSession.expires_at > now + 60; // Valid if expires more than 1 minute from now
  };

  useEffect(() => {
    let mounted = true;
    console.log("AuthProvider useEffect - Setting up auth listener");

    const initializeAuth = async () => {
      try {
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!mounted) return;

            console.log("Auth state changed:", event, {
              userId: currentSession?.user?.id,
              hasSession: !!currentSession,
              expiresAt: currentSession?.expires_at,
              sessionValid: isSessionValid(currentSession)
            });
            
            // Handle sign out event immediately
            if (event === 'SIGNED_OUT' || !currentSession) {
              console.log("User signed out or no session, clearing all state");
              setSession(null);
              setUser(null);
              setProfile(null);
              setLoading(false);
              setInitialized(true);
              return;
            }

            // Only proceed if session is valid
            if (!isSessionValid(currentSession)) {
              console.log("Session expired, clearing state");
              setSession(null);
              setUser(null);
              setProfile(null);
              setLoading(false);
              setInitialized(true);
              return;
            }
            
            // Update session and user state
            setSession(currentSession);
            setUser(currentSession.user);
            
            // Fetch profile data with small delay to ensure session is stable
            if (currentSession.user) {
              setTimeout(async () => {
                if (mounted && isSessionValid(currentSession)) {
                  const profileData = await fetchProfile(currentSession.user.id);
                  if (mounted) {
                    setProfile(profileData);
                    setLoading(false);
                    setInitialized(true);
                  }
                }
              }, 100);
            } else {
              setProfile(null);
              setLoading(false);
              setInitialized(true);
            }
          }
        );

        // Check for existing session
        console.log("Checking for existing session...");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          setLoading(false);
          setInitialized(true);
          return;
        }

        console.log("Initial session check:", {
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
          expiresAt: initialSession?.expires_at,
          sessionValid: isSessionValid(initialSession)
        });

        if (mounted && !initialized) {
          if (initialSession && isSessionValid(initialSession)) {
            setSession(initialSession);
            setUser(initialSession.user);
            
            // Fetch profile for existing session with delay
            setTimeout(async () => {
              if (mounted && isSessionValid(initialSession)) {
                const profileData = await fetchProfile(initialSession.user.id);
                if (mounted) {
                  setProfile(profileData);
                  setLoading(false);
                  setInitialized(true);
                }
              }
            }, 100);
          } else {
            setLoading(false);
            setInitialized(true);
          }
        }

        // Cleanup function
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in auth initialization:", error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const value = {
    user,
    session,
    profile,
    loading,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
