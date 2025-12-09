import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface MultiSelectComboboxProps {
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSelectCombobox({
  selectedValues = [],
  onSelectedValuesChange,
  options = [],
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  className,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Sécuriser les valeurs pour éviter undefined - utiliser des valeurs par défaut stables
  const safeOptions = React.useMemo(() => options ?? [], [options]);
  const safeSelectedValues = React.useMemo(() => selectedValues ?? [], [selectedValues]);

  const handleSelect = (labelValue: string) => {
    if (!labelValue) return;
    
    // Trouver l'option correspondante par son label (case-insensitive pour cmdk)
    const normalizedLabel = labelValue.toLowerCase();
    const selectedOption = safeOptions.find(
      (opt) => opt.label.toLowerCase() === normalizedLabel
    );
    
    if (!selectedOption) {
      return;
    }
    
    const actualValue = selectedOption.value;
    
    const newValues = safeSelectedValues.includes(actualValue)
      ? safeSelectedValues.filter((v) => v !== actualValue)
      : [...safeSelectedValues, actualValue];
    
    onSelectedValuesChange(newValues);
  };

  const handleRemove = (value: string) => {
    onSelectedValuesChange(safeSelectedValues.filter((v) => v !== value));
  };

  const getLabel = (value: string) => {
    return safeOptions.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {safeSelectedValues.length > 0
                ? `${safeSelectedValues.length} sélectionné(s)`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {safeOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(selectedLabel) => handleSelect(selectedLabel)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeSelectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {safeSelectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeSelectedValues.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="gap-1"
            >
              {getLabel(value)}
              <button
                type="button"
                onClick={() => handleRemove(value)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
