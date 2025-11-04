import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { formatKPIValue } from "@/lib/kpiCalculations";

interface ChartDataPoint {
  date: string;
  currentValue: number;
  previousValue?: number;
  label?: string;
}

interface KPIChartProps {
  data: ChartDataPoint[];
  kpiName: string;
  chartType: "line" | "bar" | "cumulative";
  showComparison?: boolean;
  unit: string;
  height?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
}: TooltipProps<number, string> & { unit: string }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {formatKPIValue(entry.value as number, unit)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const KPIChart = ({
  data,
  kpiName,
  chartType,
  showComparison = false,
  unit,
  height = 400,
}: KPIChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Aucune donnée à afficher
      </div>
    );
  }

  const commonProps = {
    width: "100%",
    height,
  };

  if (chartType === "line") {
    return (
      <ResponsiveContainer {...commonProps}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => formatKPIValue(value, unit)}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="currentValue"
            name={kpiName}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="previousValue"
              name={`${kpiName} N-1`}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => formatKPIValue(value, unit)}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend />
          <Bar
            dataKey="currentValue"
            name={kpiName}
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
          {showComparison && (
            <Bar
              dataKey="previousValue"
              name={`${kpiName} N-1`}
              fill="hsl(var(--muted-foreground))"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Cumulative chart
  return (
    <ResponsiveContainer {...commonProps}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => formatKPIValue(value, unit)}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="currentValue"
          name={`Cumul ${kpiName}`}
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.6}
        />
        {showComparison && (
          <Area
            type="monotone"
            dataKey="previousValue"
            name={`Cumul ${kpiName} N-1`}
            stroke="hsl(var(--muted-foreground))"
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.3}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};
