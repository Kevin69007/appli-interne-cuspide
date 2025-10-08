import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecurrenceSelectorProps {
  value: any;
  onChange: (value: any) => void;
}

export const RecurrenceSelector = ({ value, onChange }: RecurrenceSelectorProps) => {
  const [recurrenceType, setRecurrenceType] = useState(value?.type || "none");
  const [complexOccurrence, setComplexOccurrence] = useState(value?.complex?.occurrence || "premier");
  const [complexDay, setComplexDay] = useState(value?.complex?.day || "lundi");

  const handleTypeChange = (type: string) => {
    setRecurrenceType(type);

    if (type === "none") {
      onChange(null);
    } else if (type === "jour" || type === "semaine" || type === "mois") {
      onChange({ type: "simple", simple: type });
    } else if (type === "complex") {
      onChange({
        type: "complex",
        complex: {
          occurrence: complexOccurrence,
          day: complexDay,
          period: "mois",
        },
      });
    }
  };

  const handleComplexChange = (occurrence: string, day: string) => {
    setComplexOccurrence(occurrence);
    setComplexDay(day);
    onChange({
      type: "complex",
      complex: {
        occurrence,
        day,
        period: "mois",
      },
    });
  };

  return (
    <div className="space-y-3">
      <Label>Récurrence (optionnel)</Label>
      <Select value={recurrenceType} onValueChange={handleTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Aucune récurrence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucune</SelectItem>
          <SelectItem value="jour">Tous les jours</SelectItem>
          <SelectItem value="semaine">Toutes les semaines</SelectItem>
          <SelectItem value="mois">Tous les mois</SelectItem>
          <SelectItem value="complex">Récurrence personnalisée</SelectItem>
        </SelectContent>
      </Select>

      {recurrenceType === "complex" && (
        <div className="flex gap-2 mt-2">
          <Select value={complexOccurrence} onValueChange={(v) => handleComplexChange(v, complexDay)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="premier">1er</SelectItem>
              <SelectItem value="deuxieme">2ème</SelectItem>
              <SelectItem value="troisieme">3ème</SelectItem>
              <SelectItem value="quatrieme">4ème</SelectItem>
              <SelectItem value="dernier">Dernier</SelectItem>
            </SelectContent>
          </Select>

          <Select value={complexDay} onValueChange={(v) => handleComplexChange(complexOccurrence, v)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lundi">Lundi</SelectItem>
              <SelectItem value="mardi">Mardi</SelectItem>
              <SelectItem value="mercredi">Mercredi</SelectItem>
              <SelectItem value="jeudi">Jeudi</SelectItem>
              <SelectItem value="vendredi">Vendredi</SelectItem>
              <SelectItem value="samedi">Samedi</SelectItem>
              <SelectItem value="dimanche">Dimanche</SelectItem>
            </SelectContent>
          </Select>

          <span className="flex items-center text-sm text-muted-foreground">du mois</span>
        </div>
      )}
    </div>
  );
};
