import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodRating {
  employee_id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  rating: number;
  commentaire: string | null;
}

interface MoodStats {
  averageRating: number;
  totalRatings: number;
  distribution: { [key: number]: number };
}

export const MoodRatingsAdmin = () => {
  const [ratings, setRatings] = useState<MoodRating[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRatings();
  }, [selectedMonth, selectedYear]);

  const fetchRatings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('mood_ratings')
      .select(`
        employee_id,
        rating,
        commentaire,
        employee:employees(nom, prenom, photo_url)
      `)
      .eq('mois', selectedMonth)
      .eq('annee', selectedYear)
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching mood ratings:', error);
      setLoading(false);
      return;
    }

    const ratingsData = (data || []).map((item: any) => ({
      employee_id: item.employee_id,
      nom: item.employee.nom,
      prenom: item.employee.prenom,
      photo_url: item.employee.photo_url,
      rating: item.rating,
      commentaire: item.commentaire
    }));

    setRatings(ratingsData);

    // Calculer les statistiques
    if (ratingsData.length > 0) {
      const avgRating = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
      const distribution = ratingsData.reduce((acc: any, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {});

      setStats({
        averageRating: avgRating,
        totalRatings: ratingsData.length,
        distribution
      });
    } else {
      setStats(null);
    }

    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
            )}
          />
        ))}
      </div>
    );
  };

  const getMoodLabel = (rating: number) => {
    const labels: { [key: number]: string } = {
      1: "Très insatisfait",
      2: "Insatisfait",
      3: "Neutre",
      4: "Satisfait",
      5: "Très satisfait"
    };
    return labels[rating] || "";
  };

  const getMoodColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating === 3) return "text-orange-600";
    return "text-red-600";
  };

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Mood Bar - Satisfaction des employés</h3>
          
          <div className="flex gap-4 mb-6">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : !stats ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucune notation pour cette période</p>
          </div>
        ) : (
          <>
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Note moyenne</p>
                <div className="flex items-center gap-2">
                  <p className={cn("text-3xl font-bold", getMoodColor(stats.averageRating))}>
                    {stats.averageRating.toFixed(1)}
                  </p>
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {getMoodLabel(Math.round(stats.averageRating))}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Taux de participation</p>
                <p className="text-3xl font-bold">{stats.totalRatings}</p>
                <p className="text-xs text-muted-foreground mt-2">employés ont noté</p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Distribution</p>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs w-6">{star}★</span>
                      <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full"
                          style={{ 
                            width: `${((stats.distribution[star] || 0) / stats.totalRatings) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {stats.distribution[star] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Liste des employés */}
            <div>
              <h4 className="font-medium mb-3">Détail par employé</h4>
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <Card key={rating.employee_id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={rating.photo_url || undefined} />
                          <AvatarFallback>{rating.prenom[0]}{rating.nom[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {rating.prenom} {rating.nom}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(rating.rating)}
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getMoodColor(rating.rating))}
                            >
                              {getMoodLabel(rating.rating)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    {rating.commentaire && (
                      <p className="text-sm text-muted-foreground mt-3 pl-12 italic">
                        "{rating.commentaire}"
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};