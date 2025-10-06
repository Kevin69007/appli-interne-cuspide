import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SpinWheelProps {
  onSpinComplete: () => void;
  profile: any;
}

interface WheelReward {
  id: number;
  label: string;
  pawDollars?: number;
  pawPoints?: number;
  probability: number;
  color: string;
  textColor: string;
}

const WHEEL_REWARDS: WheelReward[] = [
  { id: 1, label: "1000 PP", pawPoints: 1000, probability: 25, color: "#FFB6C1", textColor: "#FFF" },
  { id: 2, label: "5 PD", pawDollars: 5, probability: 20, color: "#FFA500", textColor: "#FFF" },
  { id: 3, label: "50 PD", pawDollars: 50, probability: 10, color: "#FF69B4", textColor: "#FFF" },
  { id: 4, label: "Empty Bowl", probability: 15, color: "#FF8C00", textColor: "#FFF" },
  { id: 5, label: "10 PD", pawDollars: 10, probability: 15, color: "#FF4500", textColor: "#FFF" },
  { id: 6, label: "2000 PP", pawPoints: 2000, probability: 15, color: "#FF1493", textColor: "#FFF" },
];

const COOLDOWN_HOURS = 4;
const SPIN_DURATION = 3000;

const SpinWheel = ({ onSpinComplete, profile }: SpinWheelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const spinLockRef = useRef<boolean>(false);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      spinLockRef.current = false;
    };
  }, []);

  // Improved spin eligibility check with proper timezone handling
  const checkSpinEligibility = useCallback(() => {
    if (!profile) {
      setCanSpin(false);
      setTimeUntilNextSpin("");
      return false;
    }

    try {
      if (!profile.last_wheel_spin) {
        setCanSpin(true);
        setTimeUntilNextSpin("");
        return true;
      }

      const lastSpin = new Date(profile.last_wheel_spin);
      const now = new Date();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const nextSpinTime = new Date(lastSpin.getTime() + cooldownMs);

      if (now >= nextSpinTime) {
        setCanSpin(true);
        setTimeUntilNextSpin("");
        return true;
      } else {
        setCanSpin(false);
        const timeRemaining = Math.max(0, nextSpinTime.getTime() - now.getTime());
        const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
        const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
        setTimeUntilNextSpin(`${hours}h ${minutes}m ${seconds}s`);
        return false;
      }
    } catch (error) {
      console.error("Error checking spin eligibility:", error);
      setCanSpin(false);
      setTimeUntilNextSpin("");
      return false;
    }
  }, [profile]);

  // Initialize spin eligibility
  useEffect(() => {
    if (profile && !isInitialized) {
      checkSpinEligibility();
      setIsInitialized(true);
    }
  }, [profile, checkSpinEligibility, isInitialized]);

  // Countdown timer with proper cleanup
  useEffect(() => {
    if (!isInitialized || !profile || isSpinning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!canSpin) {
      intervalRef.current = setInterval(() => {
        checkSpinEligibility();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [canSpin, checkSpinEligibility, isInitialized, profile, isSpinning]);

  const selectReward = (): WheelReward => {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;
    
    for (const reward of WHEEL_REWARDS) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }
    
    return WHEEL_REWARDS[WHEEL_REWARDS.length - 1];
  };

  const spinWheel = async () => {
    // Prevent multiple simultaneous spins with lock
    if (!user || !profile || !canSpin || isSpinning || spinLockRef.current) {
      if (!canSpin && timeUntilNextSpin) {
        toast({
          title: "Treat Dispenser Cooldown",
          description: `Please wait ${timeUntilNextSpin} before spinning again.`,
          variant: "destructive",
        });
      }
      return;
    }

    // Set spin lock to prevent race conditions
    spinLockRef.current = true;
    setIsSpinning(true);
    
    // Clear existing timers
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    try {
      // Double-check eligibility in database to prevent race conditions
      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("last_wheel_spin")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to verify spin eligibility: ${profileError.message}`);
      }

      if (currentProfile.last_wheel_spin) {
        const lastSpin = new Date(currentProfile.last_wheel_spin);
        const now = new Date();
        const timeSinceLastSpin = now.getTime() - lastSpin.getTime();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        if (timeSinceLastSpin < cooldownMs) {
          throw new Error("Cooldown period has not elapsed yet");
        }
      }

      const selectedReward = selectReward();
      
      // Calculate animation
      const baseRotation = 1800;
      const segmentAngle = 360 / WHEEL_REWARDS.length;
      const rewardIndex = WHEEL_REWARDS.findIndex(r => r.id === selectedReward.id);
      
      if (rewardIndex === -1) {
        throw new Error("Invalid reward selected");
      }
      
      const targetAngle = (rewardIndex * segmentAngle) + (segmentAngle / 2);
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.6);
      const finalAngle = 360 - targetAngle + randomOffset;
      const totalRotation = baseRotation + finalAngle;

      // Start animation
      if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
      }

      // Wait for animation
      await new Promise<void>((resolve) => {
        spinTimeoutRef.current = setTimeout(resolve, SPIN_DURATION);
      });

      // Process reward in a transaction-like manner
      const now = new Date().toISOString();
      const updates: any = {
        last_wheel_spin: now
      };

      let newPawDollars = Number(profile.paw_dollars) || 0;
      let newPawPoints = Number(profile.paw_points) || 0;

      if (selectedReward.pawDollars) {
        newPawDollars += selectedReward.pawDollars;
        updates.paw_dollars = newPawDollars;
      }
      
      if (selectedReward.pawPoints) {
        newPawPoints += selectedReward.pawPoints;
        updates.paw_points = newPawPoints;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // Record transactions with simplified approach
      try {
        if (selectedReward.pawDollars) {
          // Record Paw Dollars transaction
          const { error: pdTransactionError } = await supabase
            .from("paw_dollar_transactions")
            .insert({
              user_id: user.id,
              amount: selectedReward.pawDollars,
              type: 'wheel_spin',
              description: `Treat Dispenser reward: ${selectedReward.label}`,
              status: 'completed'
            });

          if (pdTransactionError) {
            console.error("Error recording PD transaction:", pdTransactionError);
          }

          // Also record in pet_transactions for compatibility
          const { error: petTransactionError } = await supabase
            .from("pet_transactions")
            .insert({
              user_id: user.id,
              pet_id: user.id, // Using user ID as placeholder for system transactions
              paw_dollars: selectedReward.pawDollars,
              description: `Treat Dispenser reward: ${selectedReward.label}`
            });

          if (petTransactionError) {
            console.error("Error recording pet transaction:", petTransactionError);
          }
        }

        if (selectedReward.pawPoints) {
          // Record Paw Points transaction
          const { error: ppTransactionError } = await supabase
            .from("pet_transactions")
            .insert({
              user_id: user.id,
              pet_id: user.id, // Using user ID as placeholder for system transactions
              paw_points: selectedReward.pawPoints,
              description: `Treat Dispenser reward: ${selectedReward.label}`
            });

          if (ppTransactionError) {
            console.error("Error recording PP transaction:", ppTransactionError);
          }
        }
      } catch (transactionError) {
        console.error("Transaction recording failed (non-critical):", transactionError);
        // Don't fail the entire process if transaction recording fails
      }

      // Show success message
      const rewardText = selectedReward.label === "Empty Bowl" 
        ? "Better luck next time! The treat dispenser is empty."
        : `Congratulations! You won ${selectedReward.label}!`;

      toast({
        title: "Treat Dispenser Result",
        description: rewardText,
        duration: 5000,
      });

      // Update state
      setCanSpin(false);
      checkSpinEligibility();
      onSpinComplete();

    } catch (error: any) {
      console.error("Spin wheel error:", error);
      toast({
        title: "Spin Failed",
        description: error.message || "Failed to process daily reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSpinning(false);
      spinLockRef.current = false;
      
      // Reset animation
      animationTimeoutRef.current = setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'none';
          wheelRef.current.style.transform = 'rotate(0deg)';
          // Force reflow
          wheelRef.current.offsetHeight;
          wheelRef.current.style.transition = '';
        }
      }, 500);
    }
  };

  const getButtonText = () => {
    if (isSpinning) return "Dispensing Treats...";
    if (!isInitialized || !profile) return "Loading...";
    if (canSpin) return "Spin for Treats!";
    return `Available in: ${timeUntilNextSpin}`;
  };

  const isButtonDisabled = !canSpin || isSpinning || !isInitialized || !profile || spinLockRef.current;

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-800">Treat Dispenser</h2>
        <p className="text-gray-600 max-w-md">
          Spin once every {COOLDOWN_HOURS} hours for a chance to win Paw Dollars, Paw Points, or... nothing!
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20">
          <div className="relative">
            <svg width="32" height="48" viewBox="0 0 32 48" className="drop-shadow-lg">
              <path 
                d="M16 48 L24 36 L20 36 L20 12 L12 12 L12 36 L8 36 Z" 
                fill="#1f2937" 
                stroke="#fff" 
                strokeWidth="1"
              />
              <circle cx="16" cy="8" r="6" fill="#1f2937" stroke="#fff" strokeWidth="1" />
            </svg>
          </div>
        </div>
        
        <div 
          ref={wheelRef}
          className="w-80 h-80 rounded-full border-8 border-orange-400 relative overflow-hidden shadow-2xl"
          style={{ 
            background: `conic-gradient(${WHEEL_REWARDS.map((reward, index) => {
              const startAngle = (index / WHEEL_REWARDS.length) * 360;
              const endAngle = ((index + 1) / WHEEL_REWARDS.length) * 360;
              return `${reward.color} ${startAngle}deg ${endAngle}deg`;
            }).join(', ')})`
          }}
        >
          {WHEEL_REWARDS.map((reward, index) => {
            const angle = (index / WHEEL_REWARDS.length) * 360 + (360 / WHEEL_REWARDS.length / 2);
            return (
              <div
                key={reward.id}
                className="absolute w-full h-full flex items-center justify-center text-sm font-bold"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'center',
                  color: reward.textColor,
                }}
              >
                <span 
                  className="absolute"
                  style={{ 
                    top: '18%',
                    transform: `rotate(${-angle}deg)`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                  }}
                >
                  {reward.label}
                </span>
              </div>
            );
          })}
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-pink-300 to-orange-300 rounded-full border-4 border-white shadow-lg"></div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <Button
          onClick={spinWheel}
          disabled={isButtonDisabled}
          className={`font-bold py-4 px-10 rounded-full text-lg shadow-xl transform transition-all duration-200 ${
            canSpin && !isSpinning && isInitialized && profile && !spinLockRef.current
              ? "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white hover:scale-105"
              : "bg-gray-400 text-gray-600 opacity-60 cursor-not-allowed"
          }`}
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default SpinWheel;
