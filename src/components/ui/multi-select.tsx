import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";


interface MultiSelectProps {
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSelect({
  selectedValues = [],
  onSelectedValuesChange,
  options = [],
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectedValuesChange(newValues);
  };

  const handleRemove = (value: string) => {
    onSelectedValuesChange(selectedValues.filter((v) => v !== value));
  };

  const getLabel = (value: string) => {
    return options.find((opt) => opt.value === value)?.label || value;
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
              {selectedValues.length > 0
                ? `${selectedValues.length} sélectionné(s)`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            <div className="p-2">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleToggle(option.value)}
                      className="flex items-center space-x-2 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    >
                      <Checkbox
                        checked={selectedValues.includes(option.value)}
                        onCheckedChange={() => handleToggle(option.value)}
                        className="pointer-events-none"
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      {selectedValues.includes(option.value) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value) => (
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
