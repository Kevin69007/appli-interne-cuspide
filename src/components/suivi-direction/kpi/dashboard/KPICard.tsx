import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { calculateVariation, formatKPIValue, calculateObjectifProgress } from "@/lib/kpiCalculations";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KPICardProps {
  kpiName: string;
  currentValue: number;
  previousValue?: number;
  sparklineData?: number[];
  unit: "currency" | "number" | "percentage" | "integer" | "decimal";
  cumulYearCurrent?: number;
  cumulYearPrevious?: number;
  objectif?: number;
  loading?: boolean;
  isCalculated?: boolean;
  colorScheme?: "blue" | "green" | "orange" | "dynamic";
  icon?: React.ReactNode;
}

export const KPICard = ({
  kpiName,
  currentValue,
  previousValue,
  sparklineData,
  unit,
  cumulYearCurrent,
  cumulYearPrevious,
  objectif,
  loading = false,
  isCalculated = false,
  colorScheme = "blue",
  icon,
}: KPICardProps) => {
  const variation = previousValue !== undefined ? calculateVariation(currentValue, previousValue) : null;
  const objectifProgress = objectif ? calculateObjectifProgress(currentValue, objectif) : null;
  const cumulVariation = cumulYearCurrent && cumulYearPrevious
    ? calculateVariation(cumulYearCurrent, cumulYearPrevious)
    : null;

  // Couleur dynamique pour l'écart de trésorerie
  const getColorClass = () => {
    if (colorScheme === "dynamic") {
      return currentValue >= 0 ? "border-green-500" : "border-red-500";
    }
    const colors = {
      blue: "border-blue-500",
      green: "border-green-500",
      orange: "border-orange-500",
    };
    return colors[colorScheme];
  };

  const getVariationColor = () => {
    if (!variation) return "text-muted-foreground";
    if (variation.direction === "up") return "text-green-600";
    if (variation.direction === "down") return "text-red-600";
    return "text-muted-foreground";
  };

  const VariationIcon = variation?.direction === "up" ? TrendingUp : variation?.direction === "down" ? TrendingDown : Minus;

  if (loading) {
    return (
      <Card className="border-l-4 border-muted animate-pulse">
        <CardHeader>
          <CardTitle className="text-lg font-medium">{kpiName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 ${getColorClass()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {icon}
            {kpiName}
          </CardTitle>
          {isCalculated && (
            <Badge variant="outline" className="text-xs">
              Calculé
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Valeur principale */}
        <div>
          <div className="text-3xl font-bold">
            {formatKPIValue(currentValue, unit)}
          </div>
          {variation && (
            <div className={`flex items-center gap-1 text-sm ${getVariationColor()}`}>
              <VariationIcon className="h-4 w-4" />
              <span>
                {variation.percent > 0 ? "+" : ""}
                {variation.percent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                ({variation.diff > 0 ? "+" : ""}
                {formatKPIValue(variation.diff, unit)})
              </span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((val, idx) => ({ value: val, index: idx }))}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={false}
                  className={colorScheme === "dynamic" ? (currentValue >= 0 ? "text-green-500" : "text-red-500") : `text-${colorScheme}-500`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cumul annuel */}
        {cumulYearCurrent !== undefined && (
          <div className="pt-3 border-t">
            <div className="text-sm text-muted-foreground">Cumul annuel</div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">
                {formatKPIValue(cumulYearCurrent, unit)}
              </span>
              {cumulVariation && cumulYearPrevious !== undefined && (
                <span className={`text-sm ${cumulVariation.direction === "up" ? "text-green-600" : "text-red-600"}`}>
                  {cumulVariation.percent > 0 ? "+" : ""}
                  {cumulVariation.percent.toFixed(1)}% vs N-1
                </span>
              )}
            </div>
          </div>
        )}

        {/* Objectif */}
        {objectif && objectifProgress !== null && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Objectif</span>
              </div>
              <span className="font-medium">
                {formatKPIValue(objectif, unit)}
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={Math.min(objectifProgress, 100)} />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {objectifProgress.toFixed(0)}% atteint
                </span>
                {objectifProgress >= 100 && (
                  <Badge variant="default" className="bg-green-600">
                    ✓ Objectif atteint
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
