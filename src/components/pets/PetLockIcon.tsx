
import { Lock } from "lucide-react";

interface PetLockIconProps {
  isLocked?: boolean;
  className?: string;
}

const PetLockIcon = ({ isLocked, className = "w-4 h-4" }: PetLockIconProps) => {
  if (!isLocked) return null;

  return (
    <div className="inline-flex" title="This pet is locked and requires a PIN to sell">
      <Lock className={`${className} text-red-600`} />
    </div>
  );
};

export default PetLockIcon;
