import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit, Copy, Trash2 } from "lucide-react";

export interface ObjectiveGroup {
  id: string;
  employee_id: string;
  employee_name: string;
  indicator_name: string;
  recurrence: string;
  target_value: number;
  points: number;
  unit: string;
  total_occurrences: number;
  declared_occurrences: number;
  occurrences: Array<{
    id: string;
    date: string;
    status: string;
    declared_value?: number;
  }>;
  isExpanded?: boolean;
}

interface ObjectiveRowGroupProps {
  obj: ObjectiveGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (obj: ObjectiveGroup) => void;
  onDuplicate: (obj: ObjectiveGroup) => void;
  onDelete: (obj: ObjectiveGroup) => void;
}

export const ObjectiveRowGroup = ({
  obj,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDuplicate,
  onDelete,
}: ObjectiveRowGroupProps) => {
  return (
    <>
      {/* Ligne principale (groupée) */}
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell>{obj.employee_name}</TableCell>
        <TableCell className="font-medium">{obj.indicator_name}</TableCell>
        <TableCell>
          <Badge variant="outline">{obj.recurrence}</Badge>
        </TableCell>
        <TableCell>
          {obj.target_value} {obj.unit}
        </TableCell>
        <TableCell>
          <Badge>{obj.points} pts</Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">
              Série de {obj.total_occurrences}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {obj.declared_occurrences}/{obj.total_occurrences} déclarées
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(obj)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDuplicate(obj)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(obj)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Lignes détaillées (occurrences) */}
      {isExpanded && obj.occurrences.map((occ) => (
        <TableRow key={occ.id} className="bg-muted/50">
          <TableCell></TableCell>
          <TableCell colSpan={2} className="pl-12 text-sm text-muted-foreground">
            {new Date(occ.date).toLocaleDateString('fr-FR')}
          </TableCell>
          <TableCell>
            <Badge variant={occ.status === "valide" ? "default" : "secondary"}>
              {occ.status === "valide" ? "Validé" : "En attente"}
            </Badge>
          </TableCell>
          <TableCell className="text-sm">
            {occ.declared_value ? `${occ.declared_value} ${obj.unit}` : "-"}
          </TableCell>
          <TableCell colSpan={3}></TableCell>
        </TableRow>
      ))}
    </>
  );
};
