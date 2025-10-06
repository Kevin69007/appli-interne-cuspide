
interface StatValueIndicatorProps {
  value: number;
}

const StatValueIndicator = ({ value }: StatValueIndicatorProps) => {
  const getIndicatorColor = (val: number) => {
    if (val >= 80) return "text-green-500";
    if (val >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getIndicatorSymbol = (val: number) => {
    if (val >= 80) return "●";
    if (val >= 50) return "◐";
    return "○";
  };

  return (
    <span className={`text-xs ${getIndicatorColor(value)}`}>
      {getIndicatorSymbol(value)}
    </span>
  );
};

export default StatValueIndicator;
