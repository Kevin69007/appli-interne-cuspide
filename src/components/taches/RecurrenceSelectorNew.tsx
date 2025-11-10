import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface RecurrenceSelectorProps {
  value: any;
  onChange: (value: any) => void;
}

export const RecurrenceSelectorNew = ({ value, onChange }: RecurrenceSelectorProps) => {
  const [enabled, setEnabled] = useState(!!value);
  const [frequency, setFrequency] = useState(value?.frequency || 1);
  const [unit, setUnit] = useState(value?.unit || "jour");
  const [time, setTime] = useState(value?.time || "09:00");
  const [startDate, setStartDate] = useState(value?.startDate || "");
  const [endType, setEndType] = useState(value?.endType || "never");
  const [endDate, setEndDate] = useState(value?.endDate || "");
  const [occurrences, setOccurrences] = useState(value?.occurrences || 30);

  useEffect(() => {
    if (enabled) {
      onChange({
        frequency,
        unit,
        time,
        startDate,
        endType,
        endDate: endType === "date" ? endDate : null,
        occurrences: endType === "occurrences" ? occurrences : null,
      });
    } else {
      onChange(null);
    }
  }, [enabled, frequency, unit, time, startDate, endType, endDate, occurrences]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="enable-recurrence"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked as boolean)}
        />
        <Label htmlFor="enable-recurrence" className="font-medium cursor-pointer">
          Activer la récurrence
          <p className="text-xs text-muted-foreground font-normal">
            Créer automatiquement des tâches récurrentes
          </p>
        </Label>
      </div>

      {enabled && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label>Fréquence de répétition</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="1"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">jour</SelectItem>
                  <SelectItem value="semaine">semaine</SelectItem>
                  <SelectItem value="mois">mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Définir l'heure</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Début</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Fin</Label>
            <RadioGroup value={endType} onValueChange={setEndType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="font-normal cursor-pointer">
                  Jamais
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label htmlFor="date" className="font-normal cursor-pointer">
                  Le
                </Label>
                {endType === "date" && (
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="ml-2 flex-1"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="occurrences" id="occurrences" />
                <Label htmlFor="occurrences" className="font-normal cursor-pointer">
                  Après
                </Label>
                {endType === "occurrences" && (
                  <Input
                    type="number"
                    min="1"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value) || 30)}
                    className="ml-2 w-20"
                  />
                )}
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
};