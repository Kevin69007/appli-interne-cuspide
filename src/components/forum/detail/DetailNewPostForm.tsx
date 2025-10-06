
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/forum/RichTextEditor";

interface DetailNewPostFormProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const DetailNewPostForm = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel
}: DetailNewPostFormProps) => {
  const handleSubmit = () => {
    // Basic validation - just check if title and content exist
    if (!title?.trim() || !content?.trim()) {
      return;
    }

    onSubmit();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800">Create New Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Post title..."
        />
        <RichTextEditor
          value={content}
          onChange={onContentChange}
          placeholder="Write your post content..."
          rows={6}
        />
        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit}
            className="bg-pink-600 hover:bg-pink-700"
            disabled={!title?.trim() || !content?.trim()}
          >
            Create Post
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailNewPostForm;
