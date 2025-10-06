
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import UserProfileDisplay from "./UserProfileDisplay";
import RichTextEditor from "@/components/forum/RichTextEditor";
import FormattedText from "@/components/forum/FormattedText";
import LoveButton from "../LoveButton";

interface ReplyItemProps {
  reply: any;
  user: any;
  isEditing: boolean;
  editContent: string;
  onEdit: () => void;
  onDelete: () => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ReplyItem = ({
  reply,
  user,
  isEditing,
  editContent,
  onEdit,
  onDelete,
  onContentChange,
  onSave,
  onCancel
}: ReplyItemProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-pink-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <UserProfileDisplay 
            profile={reply.user_profile} 
            userId={reply.user_id}
            timestamp={reply.created_at}
            isEdited={reply.is_edited}
            editedAt={reply.edited_at}
            isReply={true}
          />
          <div className="flex items-center gap-2">
            <LoveButton replyId={reply.id} />
            {user?.id === reply.user_id && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <RichTextEditor
              value={editContent}
              onChange={onContentChange}
              rows={3}
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
        ) : (
          <FormattedText content={reply.content} />
        )}
      </CardContent>
    </Card>
  );
};

export default ReplyItem;
