
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/forum/RichTextEditor";

interface DetailReplyFormProps {
  content: string;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
}

const DetailReplyForm = ({ content, onContentChange, onSubmit }: DetailReplyFormProps) => {
  const handleSubmit = () => {
    // Basic validation - just check if content exists
    if (!content?.trim()) {
      return;
    }

    onSubmit();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800">Post a Reply</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RichTextEditor
          value={content}
          onChange={onContentChange}
          placeholder="Write your reply..."
          rows={4}
        />
        <Button 
          onClick={handleSubmit}
          className="bg-pink-600 hover:bg-pink-700"
          disabled={!content?.trim()}
        >
          Post Reply
        </Button>
      </CardContent>
    </Card>
  );
};

export default DetailReplyForm;
