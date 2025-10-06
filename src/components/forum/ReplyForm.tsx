
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ReplyFormProps {
  postId: string;
  replyContent: string;
  onReplyContentChange: (postId: string, content: string) => void;
  onSubmitReply: (postId: string) => Promise<void>;
}

const ReplyForm = ({ postId, replyContent, onReplyContentChange, onSubmitReply }: ReplyFormProps) => {
  return (
    <div className="space-y-3 mb-4">
      <Textarea
        placeholder="Write your reply..."
        value={replyContent}
        onChange={(e) => onReplyContentChange(postId, e.target.value)}
        rows={3}
      />
      <Button
        size="sm"
        onClick={() => onSubmitReply(postId)}
        disabled={!replyContent?.trim()}
        className="bg-pink-600 hover:bg-pink-700"
      >
        Post Reply
      </Button>
    </div>
  );
};

export default ReplyForm;
