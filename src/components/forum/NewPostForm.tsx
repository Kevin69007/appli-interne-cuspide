
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface NewPostFormProps {
  onSubmit: (title: string, content: string) => Promise<void>;
  submitting: boolean;
}

const NewPostForm = ({ onSubmit, submitting }: NewPostFormProps) => {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  const handleSubmit = async () => {
    await onSubmit(newPostTitle, newPostContent);
    setNewPostTitle("");
    setNewPostContent("");
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-pink-800">Create New Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Post title..."
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
        />
        <Textarea
          placeholder="What's on your mind?"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          rows={4}
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting || !newPostTitle.trim() || !newPostContent.trim()}
          className="bg-pink-600 hover:bg-pink-700"
        >
          {submitting ? "Posting..." : "Create Post"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NewPostForm;
