
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";
import UserProfileDisplay from "./UserProfileDisplay";
import LoveButton from "../LoveButton";

interface PostHeaderProps {
  post: any;
  user: any;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const PostHeader = ({ post, user, isEditing, onEdit, onDelete }: PostHeaderProps) => {
  return (
    <>
      <UserProfileDisplay 
        profile={post.user_profile} 
        userId={post.user_id}
        timestamp={post.created_at}
        isEdited={post.is_edited}
        editedAt={post.edited_at}
      />
      {!isEditing && (
        <div className="flex items-center justify-between">
          <CardTitle className="text-pink-800">{post.title}</CardTitle>
          <div className="flex items-center gap-2">
            <LoveButton postId={post.id} />
            {user?.id === post.user_id && (
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
      )}
    </>
  );
};

export default PostHeader;
