import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Crown, Trash2, Image, Link } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "@/hooks/useChat";
import { type ChatRoom, type ChatMessageWithMember } from "@shared/schema";
import { getCurrentMember } from "@/lib/memberSession";

interface ChatRoomProps {
  chatRoom: ChatRoom;
  currentMemberId: string;
  messageDraft?: string;
  onMessageDraftChange?: (draft: string) => void;
}

export default function ChatRoomComponent({ 
  chatRoom, 
  currentMemberId, 
  messageDraft = "", 
  onMessageDraftChange 
}: ChatRoomProps) {
  const [messageText, setMessageText] = useState(messageDraft);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch initial messages
  const { data: initialMessages } = useQuery<ChatMessageWithMember[]>({
    queryKey: ['/api/chat-rooms', chatRoom.id, 'messages'],
  });

  // Use WebSocket hook for real-time messages
  const { messages, setMessages, isConnected, sendMessage, deleteMessage } = useChat(chatRoom.id);
  const currentUser = getCurrentMember();
  
  // Debug: Log current user to check admin status
  console.log('Current user:', currentUser);

  // Set initial messages when they load
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Update message text when draft changes
  useEffect(() => {
    setMessageText(messageDraft);
  }, [messageDraft]);

  // Save draft when message text changes
  useEffect(() => {
    if (onMessageDraftChange) {
      onMessageDraftChange(messageText);
    }
  }, [messageText, onMessageDraftChange]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const success = sendMessage(messageText.trim(), currentMemberId);
    if (success) {
      setMessageText("");
      if (onMessageDraftChange) {
        onMessageDraftChange("");
      }
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
  };

  const renderMessageWithMentions = (messageText: string) => {
    // Split message by @mentions and URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /(@\w+)/g;
    
    // First split by URLs, then by mentions
    const urlParts = messageText.split(urlRegex);
    
    return (
      <>
        {urlParts.map((urlPart, urlIndex) => {
          // Check if this part is a URL
          if (urlRegex.test(urlPart)) {
            return (
              <a
                key={urlIndex}
                href={urlPart}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                {urlPart}
              </a>
            );
          }
          
          // Split by mentions
          const mentionParts = urlPart.split(mentionRegex);
          
          return mentionParts.map((part, mentionIndex) => {
            if (part.startsWith('@')) {
              const mentionedGamertag = part.substring(1);
              const isCurrentUser = currentUser?.gamertag.toLowerCase() === mentionedGamertag.toLowerCase();
              
              return (
                <span
                  key={`${urlIndex}-${mentionIndex}`}
                  className={`font-semibold px-1 rounded ${
                    isCurrentUser 
                      ? 'bg-orange-500 text-white' 
                      : 'text-orange-400 hover:text-orange-300'
                  }`}
                >
                  {part}
                </span>
              );
            }
            return <span key={`${urlIndex}-${mentionIndex}`}>{part}</span>;
          });
        })}
      </>
    );
  };

  const detectImageUrls = (messageText: string) => {
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi;
    return messageText.match(imageRegex) || [];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{chatRoom.name}</h3>
            <p className="text-sm text-gray-400">
              {chatRoom.type === "general" ? "General Discussion" : "Championship Chat"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-racing-green' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-racing-green rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {message.member.gamertag.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className={`font-semibold px-2 py-1 rounded text-sm ${
                      message.member.isAdmin 
                        ? "text-white" 
                        : "text-white"
                    }`}
                    style={message.member.isAdmin ? { backgroundColor: '#f97316' } : {}}
                  >
                    {message.member.gamertag}
                  </span>
                  {message.member.isAdmin && (
                    <Crown className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-xs text-gray-400">
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {/* Delete button for admin - always show for testing */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2 hover:bg-red-600 hover:text-white opacity-70 hover:opacity-100"
                    onClick={() => deleteMessage(message.id)}
                    title="Delete message (Admin only)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-gray-300 break-words">
                  <p className="mb-2">
                    {renderMessageWithMentions(message.message)}
                  </p>
                  
                  {/* Show embedded images */}
                  {detectImageUrls(message.message).map((imageUrl, imgIndex) => (
                    <div key={imgIndex} className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Shared image"
                        className="max-w-xs max-h-64 rounded-lg border border-gray-700 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message, paste image URL, or share a link..."
              className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              maxLength={500}
              disabled={!isConnected}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!messageText.trim() || !isConnected}
              className="bg-racing-green hover:bg-racing-green/80"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Link className="w-3 h-3" />
              Paste links
            </span>
            <span className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              Paste image URLs
            </span>
            <span className="flex items-center gap-1">
              <span>@</span>
              Mention members
            </span>
            <span className="ml-auto">
              {messageText.length}/500 characters
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}