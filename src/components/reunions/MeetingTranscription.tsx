interface MeetingTranscriptionProps {
  transcription: string;
}

export const MeetingTranscription = ({ transcription }: MeetingTranscriptionProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      <h3 className="font-semibold mb-4">Transcription</h3>
      <div className="prose max-w-none">
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {transcription}
        </p>
      </div>
    </div>
  );
};
