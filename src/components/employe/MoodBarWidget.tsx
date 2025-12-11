import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";
import { Sparkles, RefreshCw } from "lucide-react";

interface MoodOption {
  emoji: string;
  labelKey: string;
  value: string;
}

interface NeedOption {
  emoji: string;
  labelKey: string;
  category: string;
}

interface Quote {
  quote_text: string;
  author: string;
  category: string;
}

const moodOptions: MoodOption[] = [
  { emoji: "😔", labelKey: "bad", value: "bad" },
  { emoji: "😐", labelKey: "neutral", value: "neutral" },
  { emoji: "😊", labelKey: "good", value: "good" },
  { emoji: "😄", labelKey: "great", value: "great" },
  { emoji: "🔥", labelKey: "fire", value: "fire" },
];

const needOptions: NeedOption[] = [
  { emoji: "💪", labelKey: "motivation", category: "motivation" },
  { emoji: "🎉", labelKey: "joy", category: "joy" },
  { emoji: "🧠", labelKey: "fun_fact", category: "fun_fact" },
  { emoji: "☮️", labelKey: "calm", category: "calm" },
  { emoji: "⚡", labelKey: "energy", category: "energy" },
];

// GIFs par catégorie de mood
const moodGifs: Record<string, string> = {
  bad: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  neutral: "https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif",
  good: "https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif",
  great: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  fire: "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif",
};

export const MoodBarWidget = ({ onVoted }: { onVoted?: (voted: boolean) => void }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    checkIfVotedToday();
  }, [user]);

  const checkIfVotedToday = async () => {
    if (!user) return;

    try {
      // Get employee ID
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return;

      setEmployeeId(employee.id);

      // Check if already voted today
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_mood")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .single();

      if (data) {
        setHasVoted(true);
        onVoted?.(true);
      }
    } catch (error) {
      console.error("Error checking vote:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuote = async (category: string) => {
    setLoadingQuote(true);
    try {
      const { data, error } = await supabase
        .from("daily_quotes")
        .select("quote_text, author, category")
        .eq("category", category)
        .eq("is_active", true);

      if (error) throw error;

      if (data && data.length > 0) {
        const randomQuote = data[Math.floor(Math.random() * data.length)];
        setQuote(randomQuote);
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleMoodSelect = (moodValue: string) => {
    setSelectedMood(moodValue);
  };

  const handleNeedSelect = async (category: string) => {
    setSelectedNeed(category);
    await fetchQuote(category);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !selectedNeed || !employeeId) return;

    setSubmitting(true);

    try {
      const moodOption = moodOptions.find((m) => m.value === selectedMood);
      if (!moodOption) return;

      const { error } = await supabase.from("daily_mood").insert({
        employee_id: employeeId,
        mood_emoji: moodOption.emoji,
        mood_label: t(`moodBar.moods.${moodOption.labelKey}`),
        need_type: selectedNeed,
        date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      // Confettis animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FF6B6B", "#4ECDC4", "#FFD93D", "#6BCB77", "#A78BFA"],
      });

      setShowResult(true);
      setHasVoted(true);
      onVoted?.(true);
    } catch (error) {
      console.error("Error submitting mood:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const refreshQuote = () => {
    if (selectedNeed) {
      fetchQuote(selectedNeed);
    }
  };

  if (loading) {
    return null;
  }

  if (hasVoted && !showResult) {
    return null;
  }

  if (showResult && selectedMood) {
    return (
      <Card variant="glass" className="p-8 text-center space-y-6 animate-fade-in hover-3d">
        <div className="flex justify-center">
          <img
            src={moodGifs[selectedMood]}
            alt="Mood animation"
            className="w-64 h-48 object-cover rounded-lg shadow-2xl shadow-primary/30"
          />
        </div>
        
        {quote && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('moodBar.yourDailyQuote')}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshQuote}
                className="hover:rotate-180 transition-transform duration-500"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <blockquote className="text-lg italic text-muted-foreground border-l-4 border-primary pl-4">
              "{quote.quote_text}"
            </blockquote>
            {quote.author && (
              <p className="text-sm text-muted-foreground">— {quote.author}</p>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card variant="glass" className="p-8 space-y-6 animate-fade-in hover-3d">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary animate-glow" />
          <h2 className="text-2xl font-display font-bold text-foreground">
            {t('moodBar.title')}
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-center text-muted-foreground font-medium text-sm sm:text-base">
            {t('moodBar.howDoYouFeel')}
          </p>
          <div className="grid grid-cols-3 sm:flex sm:justify-center gap-2 sm:gap-4">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg ${
                  selectedMood === mood.value
                    ? "border-primary bg-primary/10 scale-110 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl sm:text-4xl">{mood.emoji}</span>
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {t(`moodBar.moods.${mood.labelKey}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedMood && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-center text-muted-foreground font-medium text-sm sm:text-base">
              {t('moodBar.whatDoYouNeed')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {needOptions.map((need) => (
                <button
                  key={need.category}
                  onClick={() => handleNeedSelect(need.category)}
                  className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedNeed === need.category
                      ? "border-primary bg-primary/10 scale-105 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{need.emoji}</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    {t(`moodBar.needs.${need.labelKey}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedNeed && loadingQuote && (
          <div className="p-6 bg-background/50 rounded-lg border border-border animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground text-center animate-pulse">
                {t('moodBar.preparingQuote')}
              </p>
            </div>
          </div>
        )}

        {selectedNeed && !loadingQuote && quote && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{t('moodBar.yourDailyQuote')}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshQuote}
                  className="hover:rotate-180 transition-transform duration-500"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <blockquote className="text-base italic text-muted-foreground border-l-4 border-primary pl-4">
                "{quote.quote_text}"
              </blockquote>
              {quote.author && (
                <p className="text-sm text-muted-foreground mt-2">— {quote.author}</p>
              )}
            </div>
          </div>
        )}

        {selectedMood && selectedNeed && !loadingQuote && quote && (
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full animate-fade-in font-display"
            size="lg"
          >
            {submitting ? t('submitting') : t('moodBar.validateMood')}
          </Button>
        )}
      </div>
    </Card>
  );
};
