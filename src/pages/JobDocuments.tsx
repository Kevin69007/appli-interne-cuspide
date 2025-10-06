import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type JobCategory = "Admin" | "Prothèse";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface JobDocument {
  id: string;
  name: string;
  category: JobCategory;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  tagged_profiles?: Profile[];
}

const JobDocuments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "" as JobCategory,
    selectedProfiles: [] as string[],
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchDocuments();
      fetchProfiles();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        throw error;
      }
      
      if (data?.role === "admin") {
        setIsAdmin(true);
      } else {
        toast.error("Accès refusé : vous devez être administrateur");
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Erreur lors de la vérification des permissions");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("job_documents")
        .select(`
          *,
          job_document_profiles(
            profile_id,
            profiles(id, full_name, email)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedDocs = data?.map(doc => ({
        ...doc,
        tagged_profiles: doc.job_document_profiles?.map((jdp: any) => jdp.profiles).filter(Boolean) || []
      }));

      setDocuments(formattedDocs || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Erreur lors du chargement des documents");
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (formData.selectedProfiles.length === 0) {
      toast.error("Veuillez sélectionner au moins un profil");
      return;
    }

    try {
      const { data: docData, error: docError } = await supabase
        .from("job_documents")
        .insert({
          name: formData.name,
          category: formData.category,
          created_by: user?.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      const profileLinks = formData.selectedProfiles.map(profileId => ({
        job_document_id: docData.id,
        profile_id: profileId,
      }));

      const { error: linkError } = await supabase
        .from("job_document_profiles")
        .insert(profileLinks);

      if (linkError) throw linkError;

      toast.success("Fiche de poste créée avec succès");
      setIsDialogOpen(false);
      setFormData({ name: "", category: "" as JobCategory, selectedProfiles: [] });
      fetchDocuments();
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Erreur lors de la création de la fiche");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette fiche ?")) return;

    try {
      const { error } = await supabase
        .from("job_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Fiche supprimée avec succès");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleProfileSelection = (profileId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProfiles: prev.selectedProfiles.includes(profileId)
        ? prev.selectedProfiles.filter(id => id !== profileId)
        : [...prev.selectedProfiles, profileId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Fiches de poste</h1>
              <p className="text-muted-foreground">
                Gérez les documents de poste et leurs accès
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle fiche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une fiche de poste</DialogTitle>
                <DialogDescription>
                  Remplissez les informations et sélectionnez les profils autorisés
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de la fiche *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Prothésiste CAD/CAM"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: JobCategory) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Prothèse">Prothèse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Profils autorisés * (au moins 1)</Label>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                      {profiles.map((profile) => (
                        <div key={profile.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={profile.id}
                            checked={formData.selectedProfiles.includes(profile.id)}
                            onCheckedChange={() => toggleProfileSelection(profile.id)}
                          />
                          <label
                            htmlFor={profile.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {profile.full_name || profile.email}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Aucune fiche de poste créée
                </p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{doc.name}</CardTitle>
                      <CardDescription>
                        Catégorie: {doc.category}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="font-semibold mb-2">Profils autorisés:</p>
                    <div className="flex flex-wrap gap-2">
                      {doc.tagged_profiles && doc.tagged_profiles.length > 0 ? (
                        doc.tagged_profiles.map((profile) => (
                          <span
                            key={profile.id}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                          >
                            {profile.full_name || profile.email}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Aucun profil</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDocuments;
