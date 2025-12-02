import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskCard } from "./TaskCard";

interface Task {
  id: string;
  titre: string;
  description: string;
  date_echeance: string;
  statut: string;
  priorite: string;
  created_by: string;
  assigned_to: string;
  depend_de: string | null;
  parent_task_id: string | null;
  recurrence: any;
  commentaires: any;
  rappels: any;
  created_at: string;
  updated_at: string;
  assigned_employee?: { nom: string; prenom: string; photo_url?: string };
  creator_employee?: { nom: string; prenom: string; photo_url?: string };
  dependency_employee?: { nom: string; prenom: string; photo_url?: string };
}

interface SortableTaskCardProps {
  task: Task;
  currentEmployeeId: string | null;
  onUpdate: () => void;
  highlightTerm?: string;
  isValidationPending?: boolean;
}

export const SortableTaskCard = ({
  task,
  currentEmployeeId,
  onUpdate,
  highlightTerm,
  isValidationPending,
}: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "opacity-50 z-50" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-muted rounded-l-md hover:bg-muted/80"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <TaskCard
        task={task}
        currentEmployeeId={currentEmployeeId}
        onUpdate={onUpdate}
        highlightTerm={highlightTerm}
        isValidationPending={isValidationPending}
      />
    </div>
  );
};
