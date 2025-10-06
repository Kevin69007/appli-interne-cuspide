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
import { ArrowLeft, Plus, Trash2, FileText, Edit } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<JobDocument | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "" as JobCategory,
    selectedProfiles: [] as string[],
    fileUrl: "",
    fileName: "",
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
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        throw error;
      }
      
      if (data) {
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
          file_url: formData.fileUrl || null,
          file_name: formData.fileName || null,
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
      setFormData({ name: "", category: "" as JobCategory, selectedProfiles: [], fileUrl: "", fileName: "" });
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

  const handleEdit = (doc: JobDocument) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      category: doc.category,
      selectedProfiles: doc.tagged_profiles?.map(p => p.id) || [],
      fileUrl: doc.file_url || "",
      fileName: doc.file_name || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDoc) return;

    if (!formData.name || !formData.category) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (formData.selectedProfiles.length === 0) {
      toast.error("Veuillez sélectionner au moins un profil");
      return;
    }

    try {
      const { error: docError } = await supabase
        .from("job_documents")
        .update({
          name: formData.name,
          category: formData.category,
          file_url: formData.fileUrl || null,
          file_name: formData.fileName || null,
        })
        .eq("id", editingDoc.id);

      if (docError) throw docError;

      // Delete existing profile links
      const { error: deleteError } = await supabase
        .from("job_document_profiles")
        .delete()
        .eq("job_document_id", editingDoc.id);

      if (deleteError) throw deleteError;

      // Insert new profile links
      const profileLinks = formData.selectedProfiles.map(profileId => ({
        job_document_id: editingDoc.id,
        profile_id: profileId,
      }));

      const { error: linkError } = await supabase
        .from("job_document_profiles")
        .insert(profileLinks);

      if (linkError) throw linkError;

      toast.success("Fiche mise à jour avec succès");
      setIsEditDialogOpen(false);
      setEditingDoc(null);
      setFormData({ name: "", category: "" as JobCategory, selectedProfiles: [], fileUrl: "", fileName: "" });
      fetchDocuments();
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Erreur lors de la mise à jour");
    }
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
                    <Label htmlFor="fileUrl">Lien du document</Label>
                    <Input
                      id="fileUrl"
                      value={formData.fileUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, fileUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fileName">Nom du fichier (optionnel)</Label>
                    <Input
                      id="fileName"
                      value={formData.fileName}
                      onChange={(e) =>
                        setFormData({ ...formData, fileName: e.target.value })
                      }
                      placeholder="Ex: Guide prothésiste.pdf"
                    />
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    {doc.file_url && (
                      <div>
                        <p className="font-semibold mb-1">Document:</p>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {doc.file_name || doc.file_url}
                        </a>
                      </div>
                    )}
                    <div>
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
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la fiche de poste</DialogTitle>
              <DialogDescription>
                Modifiez les informations et les profils autorisés
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom de la fiche *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Prothésiste CAD/CAM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Catégorie *</Label>
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
                  <Label htmlFor="edit-fileUrl">Lien du document</Label>
                  <Input
                    id="edit-fileUrl"
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fileName">Nom du fichier (optionnel)</Label>
                  <Input
                    id="edit-fileName"
                    value={formData.fileName}
                    onChange={(e) =>
                      setFormData({ ...formData, fileName: e.target.value })
                    }
                    placeholder="Ex: Guide prothésiste.pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profils autorisés * (au moins 1)</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${profile.id}`}
                          checked={formData.selectedProfiles.includes(profile.id)}
                          onCheckedChange={() => toggleProfileSelection(profile.id)}
                        />
                        <label
                          htmlFor={`edit-${profile.id}`}
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
                <Button type="submit">Mettre à jour</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default JobDocuments;
