import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

moment.locale("fr");
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "task" | "meeting";
    status?: string;
    priority?: string;
    projectId?: string;
    projectTitle?: string;
  };
}

const CalendrierProjets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchEvents();
    }
  }, [user, selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, titre")
        .order("titre");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Fetch tasks
      let tasksQuery = supabase
        .from("tasks")
        .select(`
          id,
          titre,
          date_echeance,
          statut,
          is_priority,
          project_tasks(project:projects(id, titre))
        `)
        .not("date_echeance", "is", null);

      if (selectedProject !== "all") {
        tasksQuery = tasksQuery.eq("project_tasks.project_id", selectedProject);
      }

      const { data: tasks, error: tasksError } = await tasksQuery;
      if (tasksError) throw tasksError;

      // Fetch meetings
      let meetingsQuery = supabase
        .from("project_meetings")
        .select(`
          id,
          titre,
          date_reunion,
          duree_minutes,
          project:projects(id, titre)
        `);

      if (selectedProject !== "all") {
        meetingsQuery = meetingsQuery.eq("project_id", selectedProject);
      }

      const { data: meetings, error: meetingsError } = await meetingsQuery;
      if (meetingsError) throw meetingsError;

      // Convert to calendar events
      const taskEvents: CalendarEvent[] = (tasks || []).map((task) => {
        const projectInfo = task.project_tasks?.[0]?.project;
        return {
          id: task.id,
          title: `📋 ${task.titre}${projectInfo ? ` - ${projectInfo.titre}` : ""}`,
          start: new Date(task.date_echeance),
          end: new Date(task.date_echeance),
          resource: {
            type: "task" as const,
            status: task.statut,
            priority: task.is_priority ? "high" : "normal",
            projectId: projectInfo?.id,
            projectTitle: projectInfo?.titre,
          },
        };
      });

      const meetingEvents: CalendarEvent[] = (meetings || []).map((meeting) => {
        const startDate = new Date(meeting.date_reunion);
        const endDate = new Date(startDate);
        if (meeting.duree_minutes) {
          endDate.setMinutes(endDate.getMinutes() + meeting.duree_minutes);
        } else {
          endDate.setHours(endDate.getHours() + 1);
        }

        return {
          id: meeting.id,
          title: `🎤 ${meeting.titre}${meeting.project ? ` - ${meeting.project.titre}` : ""}`,
          start: startDate,
          end: endDate,
          resource: {
            type: "meeting" as const,
            projectId: meeting.project?.id,
            projectTitle: meeting.project?.titre,
          },
        };
      });

      setEvents([...taskEvents, ...meetingEvents]);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3b82f6";
    
    if (event.resource.type === "task") {
      switch (event.resource.status) {
        case "terminee":
          backgroundColor = "#22c55e";
          break;
        case "en_cours":
          backgroundColor = "#f59e0b";
          break;
        case "en_retard":
          backgroundColor = "#ef4444";
          break;
        default:
          backgroundColor = "#6b7280";
      }
      
      if (event.resource.priority === "high") {
        return {
          style: {
            backgroundColor,
            border: "2px solid #dc2626",
            fontWeight: "bold",
          },
        };
      }
    } else if (event.resource.type === "meeting") {
      backgroundColor = "#8b5cf6";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource.type === "task" && event.resource.projectId) {
      navigate(`/projets/${event.resource.projectId}`);
    } else if (event.resource.type === "meeting") {
      navigate(`/reunions/${event.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Chargement du calendrier...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-8 h-8" />
                Calendrier des Projets
              </h1>
              <p className="text-muted-foreground">
                Vue d'ensemble des tâches et réunions
              </p>
            </div>
          </div>
          
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrer par projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-4 bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#8b5cf6] rounded" />
            <span className="text-sm">Réunion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#6b7280] rounded" />
            <span className="text-sm">Tâche à venir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#f59e0b] rounded" />
            <span className="text-sm">Tâche en cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#22c55e] rounded" />
            <span className="text-sm">Tâche terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ef4444] rounded" />
            <span className="text-sm">Tâche en retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#dc2626] rounded" />
            <span className="text-sm">Tâche prioritaire</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-lg border border-border p-6" style={{ height: "700px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            messages={{
              next: "Suivant",
              previous: "Précédent",
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              date: "Date",
              time: "Heure",
              event: "Événement",
              noEventsInRange: "Aucun événement dans cette période",
              showMore: (total) => `+ ${total} de plus`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendrierProjets;
