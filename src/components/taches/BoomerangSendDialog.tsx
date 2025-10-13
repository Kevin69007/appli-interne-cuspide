import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface BoomerangSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  currentEmployeeId: string;
  onBoomerangSent: () => void;
}

export const BoomerangSendDialog = ({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  currentEmployeeId,
  onBoomerangSent,
}: BoomerangSendDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [duration, setDuration] = useState("24");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, user_id")
      .neq("id", currentEmployeeId)
      .order("nom");

    if (!error && data) {
      // Filtrer les admins
      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = new Set(adminUsers?.map(u => u.user_id) || []);
      const nonAdminEmployees = data.filter(emp => !adminIds.has(emp.user_id));
      
      setEmployees(nonAdminEmployees);
    }
  };

  const calculateDeadline = (hours: number) => {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now.toISOString();
  };

  const handleSend = async () => {
    if (!selectedEmployee) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }

    setLoading(true);
    try {
      const durationHours = parseInt(duration);
      const deadline = calculateDeadline(durationHours);

      // Get current employee name
      const { data: currentEmp } = await supabase
        .from("employees")
        .select("nom, prenom")
        .eq("id", currentEmployeeId)
        .single();

      // Get selected employee name
      const { data: selectedEmp } = await supabase
        .from("employees")
        .select("nom, prenom")
        .eq("id", selectedEmployee)
        .single();

      const historyEntry = {
        from: currentEmployeeId,
        to: selectedEmployee,
        from_name: currentEmp ? `${currentEmp.prenom} ${currentEmp.nom}` : "",
        to_name: selectedEmp ? `${selectedEmp.prenom} ${selectedEmp.nom}` : "",
        sent_at: new Date().toISOString(),
        returned_at: null,
        comment: comment || null,
      };

      const { error } = await supabase
        .from("tasks")
        .update({
          boomerang_active: true,
          boomerang_original_owner: currentEmployeeId,
          boomerang_current_holder: selectedEmployee,
          boomerang_deadline: deadline,
          boomerang_duration_hours: durationHours,
          boomerang_history: [historyEntry],
        })
        .eq("id", taskId);

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        employee_id: selectedEmployee,
        titre: "🪃 Boomerang reçu",
        message: `Vous avez reçu un boomerang : ${taskTitle}${comment ? ` - ${comment}` : ""}`,
        type: "boomerang_received",
        url: "/taches",
      });

      toast.success("Boomerang envoyé avec succès");
      onOpenChange(false);
      onBoomerangSent();
      setSelectedEmployee("");
      setComment("");
    } catch (error) {
      console.error("Error sending boomerang:", error);
      toast.error("Erreur lors de l'envoi du boomerang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🪃 Envoyer en Boomerang</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Employé destinataire *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un collègue" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.prenom} {emp.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Durée *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 heures</SelectItem>
                <SelectItem value="48">48 heures</SelectItem>
                <SelectItem value="72">72 heures</SelectItem>
                <SelectItem value="168">1 semaine</SelectItem>
                <SelectItem value="336">2 semaines</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Commentaire (optionnel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Message à transmettre avec le boomerang"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSend} disabled={loading || !selectedEmployee}>
              {loading ? "Envoi..." : "🪃 Envoyer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
