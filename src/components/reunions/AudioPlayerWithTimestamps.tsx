import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Timestamp {
  id: string;
  timestamp_seconds: number;
  note?: string;
  project_titre?: string;
  task_titre?: string;
}

interface AudioPlayerWithTimestampsProps {
  audioUrl: string;
  timestamps: Timestamp[];
  canDownload?: boolean;
}

export const AudioPlayerWithTimestamps = ({
  audioUrl,
  timestamps,
  canDownload = false,
}: AudioPlayerWithTimestampsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const jumpToTimestamp = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = seconds;
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentTimestamp = () => {
    return timestamps.find(
      (ts, index) => {
        const nextTs = timestamps[index + 1];
        return (
          currentTime >= ts.timestamp_seconds &&
          (!nextTs || currentTime < nextTs.timestamp_seconds)
        );
      }
    );
  };

  const currentTimestamp = getCurrentTimestamp();
  const sortedTimestamps = [...timestamps].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="metadata"
          controlsList={canDownload ? undefined : "nodownload"}
          onContextMenu={canDownload ? undefined : (e) => e.preventDefault()}
        />

        {!canDownload && (
          <p className="text-xs text-muted-foreground mb-4">
            Téléchargement réservé aux administrateurs
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-primary transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Timestamp markers */}
            {sortedTimestamps.map((ts) => (
              <div
                key={ts.id}
                className="absolute top-0 bottom-0 w-1 bg-accent cursor-pointer hover:w-2 transition-all"
                style={{ left: `${duration ? (ts.timestamp_seconds / duration) * 100 : 0}%` }}
                onClick={() => jumpToTimestamp(ts.timestamp_seconds)}
                title={`${formatTime(ts.timestamp_seconds)} - ${ts.project_titre}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => skip(-10)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button onClick={togglePlayPause} size="lg" className="w-20">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => skip(10)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Current timestamp info */}
        {currentTimestamp && (
          <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{formatTime(currentTimestamp.timestamp_seconds)}</Badge>
              <span className="font-medium">{currentTimestamp.project_titre}</span>
              {currentTimestamp.task_titre && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm text-muted-foreground">
                    {currentTimestamp.task_titre}
                  </span>
                </>
              )}
            </div>
            {currentTimestamp.note && (
              <p className="text-sm text-muted-foreground">{currentTimestamp.note}</p>
            )}
          </div>
        )}
      </Card>

      {/* Timestamps list */}
      <div>
        <h3 className="font-semibold mb-3">Points abordés ({sortedTimestamps.length})</h3>
        <div className="space-y-2">
          {sortedTimestamps.map((ts) => (
            <Card
              key={ts.id}
              className={`p-3 cursor-pointer transition-all hover:border-primary ${
                currentTimestamp?.id === ts.id ? "border-primary bg-accent/5" : ""
              }`}
              onClick={() => jumpToTimestamp(ts.timestamp_seconds)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{formatTime(ts.timestamp_seconds)}</Badge>
                    <span className="font-medium">{ts.project_titre}</span>
                    {ts.task_titre && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">{ts.task_titre}</span>
                      </>
                    )}
                  </div>
                  {ts.note && <p className="text-sm text-muted-foreground">{ts.note}</p>}
                </div>
                <Button variant="ghost" size="sm">
                  Écouter
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
