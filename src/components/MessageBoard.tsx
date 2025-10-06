
import { useMessageBoard } from "@/hooks/useMessageBoard";
import MessageForm from "@/components/messages/MessageForm";
import MessageList from "@/components/messages/MessageList";

interface MessageBoardProps {
  profileUserId?: string;
  isOwnProfile?: boolean;
}

const MessageBoard = ({ profileUserId, isOwnProfile = true }: MessageBoardProps) => {
  const {
    messages,
    loading,
    currentPage,
    totalMessages,
    totalPages,
    user,
    actualProfileUserId,
    fetchMessages,
    deleteMessage,
    markAsRead,
    sendMessage,
    handlePageChange,
    isDeletingMessage
  } = useMessageBoard(profileUserId, isOwnProfile);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isOwnProfile && user && actualProfileUserId && user.id !== actualProfileUserId && (
        <MessageForm onSendMessage={sendMessage} />
      )}

      <MessageList
        messages={messages}
        isOwnProfile={isOwnProfile}
        currentPage={currentPage}
        totalPages={totalPages}
        totalMessages={totalMessages}
        onDelete={deleteMessage}
        onMarkAsRead={markAsRead}
        onReplySubmitted={fetchMessages}
        onPageChange={handlePageChange}
        isDeletingMessage={isDeletingMessage}
      />
    </div>
  );
};

export default MessageBoard;
