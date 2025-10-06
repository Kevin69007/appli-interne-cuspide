
import { cn } from "@/lib/utils";

interface StatBarProps {
  value: number;
  maxValue: number;
  className?: string;
  showValue?: boolean;
}

export const StatBar = ({ value, maxValue, className, showValue = true }: StatBarProps) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className={cn("w-full bg-gray-200 rounded-full", className)}>
      <div 
        className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%`, height: '100%' }}
      />
      {showValue && (
        <span className="sr-only">{value}/{maxValue}</span>
      )}
    </div>
  );
};
