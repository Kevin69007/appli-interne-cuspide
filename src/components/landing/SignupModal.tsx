import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart } from "lucide-react";
import AlphaKeyForm from "@/components/auth/AlphaKeyForm";
import { validatePassword } from "@/utils/passwordValidation";
import { validateTextForProfanity } from "@/utils/profanityFilter";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPet: any;
}

const SignupModal = ({ isOpen, onClose, selectedPet }: SignupModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [petName, setPetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(selectedPet ? false : true);
  const [showAlphaKey, setShowAlphaKey] = useState(false);
  const [validAlphaKey, setValidAlphaKey] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateUsername = (username: string): boolean => {
    // Only allow letters and numbers
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(username);
  };

  const generateRandomPetName = () => {
    const names = [
      'Buddy', 'Max', 'Bella', 'Luna', 'Charlie', 'Lucy', 'Cooper', 'Daisy',
      'Rocky', 'Molly', 'Duke', 'Sadie', 'Bear', 'Maggie', 'Tucker', 'Sophie',
      'Jack', 'Chloe', 'Oliver', 'Lola', 'Zeus', 'Penny', 'Bentley', 'Zoe'
    ];
    return names[Math.floor(Math.random() * names.length)];
  };

  const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", usernameToCheck)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        return true;
      }
      
      if (data) {
        // Username already exists
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  };

  const waitForProfile = async (userId: string, maxRetries = 10): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();

        if (data && !error) {
          console.log("Profile found after", i + 1, "attempts");
          return true;
        }
        
        // Wait 500ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log("Profile check attempt", i + 1, "failed:", error);
      }
    }
    return false;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validAlphaKey) {
      setShowAlphaKey(true);
      return;
    }

    if (!email || !password || !username || !petName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate username format
    if (!validateUsername(username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters and numbers (no spaces or special characters)",
        variant: "destructive",
      });
      return;
    }

    // Validate username for profanity
    const usernameCheck = validateTextForProfanity(username, 'Username');
    if (!usernameCheck.isValid) {
      toast({
        title: "Inappropriate Content",
        description: usernameCheck.message,
        variant: "destructive",
      });
      return;
    }

    // Validate pet name for profanity
    const petNameCheck = validateTextForProfanity(petName, 'Pet name');
    if (!petNameCheck.isValid) {
      toast({
        title: "Inappropriate Content",
        description: petNameCheck.message,
        variant: "destructive",
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Requirements",
        description: passwordValidation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First check if username is available
      const isUsernameAvailable = await checkUsernameAvailability(username);
      
      if (!isUsernameAvailable) {
        toast({
          title: "Username Taken",
          description: "This username is already taken. Please choose a different one.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("User already registered")) {
          toast({
            title: "Account Already Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          setIsLogin(true);
          setLoading(false);
          return;
        }
        throw authError;
      }

      if (authData.user) {
        console.log("User created, waiting for profile...");
        
        // Wait for profile to be created by the trigger
        const profileCreated = await waitForProfile(authData.user.id);
        
        if (!profileCreated) {
          console.log("Profile not created by trigger, creating manually...");
          // Create profile manually if trigger failed
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              username: username,
              xp: 0,
              tier: 'bronze',
              paw_dollars: 1000,
              paw_points: 10000
            });

          if (profileError) {
            console.error("Manual profile creation error:", profileError);
            throw new Error("Failed to create user profile");
          }
        }

        if (selectedPet) {
          console.log("Creating first pet for new user...");
          
          // Get a pet from the pets table to use as template
          const { data: petTemplates } = await supabase
            .from("pets")
            .select("*")
            .eq("type", selectedPet.type)
            .limit(1);

          if (petTemplates && petTemplates.length > 0) {
            const petTemplate = petTemplates[0];

            // Create the user's first pet using the selected pet's data
            const { error: petError } = await supabase
              .from("user_pets")
              .insert({
                user_id: authData.user.id,
                pet_id: petTemplate.id,
                pet_name: petName,
                breed: selectedPet.breed.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                gender: selectedPet.gender,
                birthday: selectedPet.birthday,
                friendliness: selectedPet.base_friendliness || 75,
                playfulness: selectedPet.base_playfulness || 75,
                energy: selectedPet.base_energy || 75,
                loyalty: selectedPet.base_loyalty || 75,
                curiosity: selectedPet.base_curiosity || 75,
                hunger: 100,
                water: 100,
                is_first_pet: true,
                adopted_at: new Date().toISOString(),
                last_fed: new Date().toISOString(),
                last_watered: new Date().toISOString(),
                last_cleaned: new Date().toISOString(),
                last_played: new Date().toISOString(),
              });

            if (petError) {
              console.error("Pet creation error:", petError);
              // Don't throw here, user can adopt later
            } else {
              console.log("First pet created successfully");
            }
          }
        }

        toast({
          title: "Welcome to PawPets!",
          description: selectedPet 
            ? `Account created successfully! ${petName} is now your first pet.`
            : "Account created successfully!",
        });

        // Close the modal
        onClose();
        
        // Redirect to the general profile page
        navigate("/profile");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMessage = "Failed to create account";
      
      if (error.message?.includes("duplicate key value violates unique constraint")) {
        if (error.message.includes("profiles_username_key")) {
          errorMessage = "Username is already taken. Please choose a different username.";
        } else if (error.message.includes("profiles_pkey")) {
          errorMessage = "An account with this email already exists.";
        }
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
        setIsLogin(true);
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });

      onClose();
      
      // Redirect to profile after successful login
      navigate("/profile");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showAlphaKey && !validAlphaKey) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <AlphaKeyForm onValidKey={() => {
            setValidAlphaKey(true);
            setShowAlphaKey(false);
          }} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Heart className="w-5 h-5 text-pink-600" />
            {selectedPet ? "Join PawPets" : (isLogin ? "Welcome Back!" : "Join PawPets")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {selectedPet 
              ? `Create your account to adopt ${selectedPet.breed.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} as your first pet!`
              : (isLogin 
                ? "Sign in to continue your pet journey"
                : "Create your account to start your pet journey"
              )
            }
          </DialogDescription>
        </DialogHeader>

        {selectedPet && (
          <div className="bg-pink-50 p-3 sm:p-4 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={selectedPet.image_url}
                alt={selectedPet.breed}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-semibold capitalize text-sm sm:text-base">{selectedPet.breed.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                  {selectedPet.gender} {selectedPet.type}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={selectedPet ? handleSignup : (isLogin ? handleLogin : handleSignup)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 text-base"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Enter your password" : "At least 8 chars, 1 uppercase, 1 number"}
              className="h-11 text-base"
              autoComplete={isLogin ? "current-password" : "new-password"}
              disabled={loading}
              required
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters with 1 uppercase letter and 1 number
              </p>
            )}
          </div>

          {(!isLogin || selectedPet) && (
            <>
              <div>
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username (letters and numbers only)"
                  className="h-11 text-base"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Username can only contain letters and numbers
                </p>
              </div>

              <div>
                <Label htmlFor="petName" className="text-sm">Pet Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="petName"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Name your pet"
                    className="h-11 text-base"
                    autoComplete="off"
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPetName(generateRandomPetName())}
                    className="h-11 px-3 text-sm"
                    disabled={loading}
                  >
                    Random
                  </Button>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedPet 
              ? "Create Account & Adopt Pet" 
              : (isLogin ? "Sign In" : "Create Account")
            }
          </Button>
        </form>

        {!selectedPet && (
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="p-0 h-auto text-sm"
            >
              {isLogin ? "Sign up here" : "Sign in instead"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
