import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ProjectCard } from "./ProjectCard";

interface SortableProjectCardProps {
  project: any;
  onUpdate: () => void;
  currentEmployeeId: string | null;
  canEdit: boolean;
}

export const SortableProjectCard = memo(({
  project,
  onUpdate,
  currentEmployeeId,
  canEdit
}: SortableProjectCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

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
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 p-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-muted rounded-l-md border border-r-0 border-border"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <ProjectCard 
        project={project} 
        onUpdate={onUpdate} 
        currentEmployeeId={currentEmployeeId} 
        canEdit={canEdit} 
      />
    </div>
  );
});
