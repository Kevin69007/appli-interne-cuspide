import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { fr } from "date-fns/locale";

export interface PeriodFilterValue {
  dateDebut: Date;
  dateFin: Date;
  comparePreviousPeriod: boolean;
  comparePreviousYear: boolean;
}

interface KPIPeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
}

export const KPIPeriodFilter = ({ value, onChange }: KPIPeriodFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      label: "Ce mois",
      getValue: () => ({
        dateDebut: startOfMonth(new Date()),
        dateFin: endOfMonth(new Date()),
      }),
    },
    {
      label: "Mois dernier",
      getValue: () => ({
        dateDebut: startOfMonth(subMonths(new Date(), 1)),
        dateFin: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
    {
      label: "3 derniers mois",
      getValue: () => ({
        dateDebut: startOfMonth(subMonths(new Date(), 2)),
        dateFin: endOfMonth(new Date()),
      }),
    },
    {
      label: "6 derniers mois",
      getValue: () => ({
        dateDebut: startOfMonth(subMonths(new Date(), 5)),
        dateFin: endOfMonth(new Date()),
      }),
    },
    {
      label: "Cette année",
      getValue: () => ({
        dateDebut: startOfYear(new Date()),
        dateFin: endOfYear(new Date()),
      }),
    },
    {
      label: "Année dernière",
      getValue: () => ({
        dateDebut: startOfYear(subYears(new Date(), 1)),
        dateFin: endOfYear(subYears(new Date(), 1)),
      }),
    },
    {
      label: "2 dernières années",
      getValue: () => ({
        dateDebut: startOfYear(subYears(new Date(), 1)),
        dateFin: endOfYear(new Date()),
      }),
    },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const dates = preset.getValue();
    onChange({
      ...value,
      ...dates,
    });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value.dateDebut, "dd MMM yyyy", { locale: fr })} -{" "}
            {format(value.dateFin, "dd MMM yyyy", { locale: fr })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Raccourcis</h4>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Période personnalisée</h4>
              <div className="flex gap-2">
                <Calendar
                  mode="single"
                  selected={value.dateDebut}
                  onSelect={(date) => date && onChange({ ...value, dateDebut: date })}
                  locale={fr}
                />
                <Calendar
                  mode="single"
                  selected={value.dateFin}
                  onSelect={(date) => date && onChange({ ...value, dateFin: date })}
                  locale={fr}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="compare-previous"
          checked={value.comparePreviousPeriod}
          onCheckedChange={(checked) =>
            onChange({ ...value, comparePreviousPeriod: checked as boolean })
          }
        />
        <Label htmlFor="compare-previous" className="text-sm font-normal cursor-pointer">
          Comparer avec période précédente
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="compare-previous-year"
          checked={value.comparePreviousYear}
          onCheckedChange={(checked) =>
            onChange({ ...value, comparePreviousYear: checked as boolean })
          }
        />
        <Label htmlFor="compare-previous-year" className="text-sm font-normal cursor-pointer">
          Comparer avec même période N-1
        </Label>
      </div>
    </div>
  );
};
