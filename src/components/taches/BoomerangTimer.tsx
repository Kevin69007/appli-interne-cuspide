import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface BoomerangTimerProps {
  deadline: string;
}

export const BoomerangTimer = ({ deadline }: BoomerangTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [colorClass, setColorClass] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setTimeRemaining("Expiré");
        setColorClass("text-red-600");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      if (hours > 48) {
        setTimeRemaining(`${days}j ${remainingHours}h`);
        setColorClass("text-green-600");
      } else if (hours > 24) {
        setTimeRemaining(`${hours}h`);
        setColorClass("text-orange-600");
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
        setColorClass("text-red-600");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${colorClass}`}>
      <Clock className="h-4 w-4" />
      <span>Retour dans {timeRemaining}</span>
    </div>
  );
};
