import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyMoodEntry {
  employee_id: string;
  nom: string;
  prenom: string;
  photo_url: string | null;
  mood_emoji: string;
  mood_label: string;
  need_type: string | null;
  date: string;
}

interface MoodStats {
  totalEntries: number;
  moodDistribution: { [emoji: string]: number };
  needDistribution: { [need: string]: number };
  participationRate: number;
}

const moodEmojiMap: { [emoji: string]: { label: string; color: string } } = {
  "😔": { label: "Très maussade", color: "text-red-600" },
  "😐": { label: "Peu motivé", color: "text-orange-600" },
  "😊": { label: "Bien", color: "text-yellow-600" },
  "😄": { label: "Très bien", color: "text-green-600" },
  "🔥": { label: "Au top!", color: "text-blue-600" }
};

const needTypeLabels: { [key: string]: string } = {
  "motivation": "Motivation",
  "fun_fact": "Culture générale",
  "joy": "Gaieté",
  "calm": "Sérénité",
  "energy": "Énergie"
};

export const MoodRatingsAdmin = () => {
  const [entries, setEntries] = useState<DailyMoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchMoodData();
  }, [periodType, selectedDate]);

  const getDateRange = () => {
    const today = new Date(selectedDate);
    let startDate: Date;
    let endDate: Date = new Date(today);

    if (periodType === 'day') {
      startDate = new Date(today);
    } else if (periodType === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchMoodData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    const { data, error } = await supabase
      .from('daily_mood')
      .select(`
        employee_id,
        mood_emoji,
        mood_label,
        need_type,
        date,
        employee:employees(nom, prenom, photo_url)
      `)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching daily mood:', error);
      setLoading(false);
      return;
    }

    const moodData = (data || []).map((item: any) => ({
      employee_id: item.employee_id,
      nom: item.employee.nom,
      prenom: item.employee.prenom,
      photo_url: item.employee.photo_url,
      mood_emoji: item.mood_emoji,
      mood_label: item.mood_label,
      need_type: item.need_type,
      date: item.date
    }));

    setEntries(moodData);

    // Calculer les statistiques
    if (moodData.length > 0) {
      const moodDist = moodData.reduce((acc: any, entry) => {
        acc[entry.mood_emoji] = (acc[entry.mood_emoji] || 0) + 1;
        return acc;
      }, {});

      const needDist = moodData.reduce((acc: any, entry) => {
        if (entry.need_type) {
          acc[entry.need_type] = (acc[entry.need_type] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculer le taux de participation (employés uniques)
      const uniqueEmployees = new Set(moodData.map(e => e.employee_id)).size;

      setStats({
        totalEntries: moodData.length,
        moodDistribution: moodDist,
        needDistribution: needDist,
        participationRate: uniqueEmployees
      });
    } else {
      setStats(null);
    }

    setLoading(false);
  };

  const formatDateLabel = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long',
      day: periodType === 'day' ? 'numeric' : undefined 
    };
    return selectedDate.toLocaleDateString('fr-FR', options);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (periodType === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (periodType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Mood Bar - Humeur quotidienne des employés</h3>
          
          <div className="flex gap-4 mb-6">
            <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Jour</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="px-3 py-2 border rounded hover:bg-accent"
              >
                ←
              </button>
              <span className="px-4 py-2 border rounded bg-background min-w-[200px] text-center">
                {formatDateLabel()}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="px-3 py-2 border rounded hover:bg-accent"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : !stats ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucune donnée pour cette période</p>
          </div>
        ) : (
          <>
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Distribution des humeurs</p>
                <div className="space-y-2">
                  {Object.entries(stats.moodDistribution).map(([emoji, count]) => (
                    <div key={emoji} className="flex items-center gap-2">
                      <span className="text-2xl">{emoji}</span>
                      <span className={cn("text-sm font-medium", moodEmojiMap[emoji]?.color)}>
                        {moodEmojiMap[emoji]?.label}
                      </span>
                      <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(count / stats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Participation</p>
                <p className="text-3xl font-bold">{stats.participationRate}</p>
                <p className="text-xs text-muted-foreground mt-2">employés actifs</p>
                <p className="text-sm text-muted-foreground mt-4">
                  {stats.totalEntries} {stats.totalEntries > 1 ? 'entrées' : 'entrée'}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Besoins exprimés</p>
                <div className="space-y-1">
                  {Object.entries(stats.needDistribution).map(([need, count]) => (
                    <div key={need} className="flex items-center justify-between text-sm">
                      <span>{needTypeLabels[need] || need}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Liste des entrées */}
            <div>
              <h4 className="font-medium mb-3">Détail des entrées</h4>
              <div className="space-y-3">
                {entries.map((entry, idx) => (
                  <Card key={`${entry.employee_id}-${entry.date}-${idx}`} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={entry.photo_url || undefined} />
                          <AvatarFallback>{entry.prenom[0]}{entry.nom[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {entry.prenom} {entry.nom}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl">{entry.mood_emoji}</span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", moodEmojiMap[entry.mood_emoji]?.color)}
                            >
                              {entry.mood_label}
                            </Badge>
                            {entry.need_type && (
                              <Badge variant="secondary" className="text-xs">
                                {needTypeLabels[entry.need_type]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
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