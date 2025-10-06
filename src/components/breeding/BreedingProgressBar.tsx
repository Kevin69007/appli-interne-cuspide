
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle } from "lucide-react";

interface BreedingProgressBarProps {
  breedingPair: any;
  isReadyToBirth: boolean;
  isReadyToWean: boolean;
}

const BreedingProgressBar = ({ breedingPair, isReadyToBirth, isReadyToWean }: BreedingProgressBarProps) => {
  const now = new Date();
  const birthDate = new Date(breedingPair.birth_date);
  const weanDate = new Date(breedingPair.wean_date);
  const breedingStart = new Date(breedingPair.breeding_started_at);

  let progress = 0;
  let statusText = "";
  let statusColor = "text-blue-600";

  if (breedingPair.is_completed) {
    progress = 100;
    statusText = "Breeding Complete!";
    statusColor = "text-green-600";
  } else if (breedingPair.is_born && breedingPair.is_weaned) {
    progress = 100;
    statusText = "Ready to collect babies!";
    statusColor = "text-green-600";
  } else if (breedingPair.is_born) {
    // Weaning phase: 50% to 100%
    const weaningStart = birthDate;
    const weaningDuration = weanDate.getTime() - weaningStart.getTime();
    const weaningElapsed = Math.max(0, now.getTime() - weaningStart.getTime());
    const weaningProgress = Math.min(1, weaningElapsed / weaningDuration);
    
    progress = 50 + (weaningProgress * 50); // 50% to 100%
    
    if (isReadyToWean) {
      statusText = "Babies are weaned and ready to collect!";
      statusColor = "text-green-600";
    } else {
      const timeLeft = Math.max(0, weanDate.getTime() - now.getTime());
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      statusText = `Weaning: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
      statusColor = "text-orange-600";
    }
  } else {
    // Conception/Birth phase: 0% to 50%
    const totalDuration = birthDate.getTime() - breedingStart.getTime();
    const elapsed = Math.max(0, now.getTime() - breedingStart.getTime());
    const birthProgress = Math.min(1, elapsed / totalDuration);
    
    progress = birthProgress * 50; // 0% to 50%
    
    if (isReadyToBirth) {
      statusText = "Ready to give birth!";
      statusColor = "text-green-600";
    } else {
      const timeLeft = Math.max(0, birthDate.getTime() - now.getTime());
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      statusText = `Pregnancy: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
      statusColor = "text-blue-600";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {progress >= 100 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Clock className="w-5 h-5 text-blue-500" />
          )}
          <span className={`font-medium ${statusColor}`}>{statusText}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      
      <Progress value={progress} className="h-3" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Conception</span>
        <span>Birth (50%)</span>
        <span>Weaning Complete</span>
      </div>
    </div>
  );
};

export default BreedingProgressBar;
