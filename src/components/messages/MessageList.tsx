
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import MessageCard from "./MessageCard";

interface MessageListProps {
  messages: any[];
  isOwnProfile: boolean;
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  onDelete: (messageId: string) => Promise<boolean>;
  onMarkAsRead: (messageId: string) => Promise<boolean>;
  onReplySubmitted: () => void;
  onPageChange: (page: number) => void;
  isDeletingMessage?: (messageId: string) => boolean;
}

const MessageList = ({
  messages,
  isOwnProfile,
  currentPage,
  totalPages,
  totalMessages,
  onDelete,
  onMarkAsRead,
  onReplySubmitted,
  onPageChange,
  isDeletingMessage
}: MessageListProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-pink-800">
            {isOwnProfile ? "My Messages" : "Messages"}
          </CardTitle>
          {totalMessages > 0 && (
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalMessages} messages)
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-4xl mb-2">💌</div>
            <p>No messages yet</p>
            {isOwnProfile && (
              <p className="text-sm mt-2">Messages from other users will appear here</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                isOwnProfile={isOwnProfile}
                onDelete={onDelete}
                onMarkAsRead={onMarkAsRead}
                onReplySubmitted={onReplySubmitted}
                isDeletingMessage={isDeletingMessage}
              />
            ))}

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageList;
