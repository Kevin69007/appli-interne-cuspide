
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/forum/RichTextEditor";
import FormattedText from "@/components/forum/FormattedText";

interface PostContentProps {
  post: any;
  isEditing: boolean;
  editTitle: string;
  editContent: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const PostContent = ({
  post,
  isEditing,
  editTitle,
  editContent,
  onTitleChange,
  onContentChange,
  onSave,
  onCancel
}: PostContentProps) => {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <Input
          value={editTitle}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <RichTextEditor
          value={editContent}
          onChange={onContentChange}
          rows={6}
        />
        <div className="flex gap-2">
          <Button onClick={onSave}>
            Save Changes
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return <FormattedText content={post.content} />;
};

export default PostContent;
