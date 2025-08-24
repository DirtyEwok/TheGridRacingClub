import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Member } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Crown, Trash2, Image, Link, Play, Heart } from "lucide-react";
import { ObjectUploader } from "./ObjectUploader";
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
    queryFn: async () => {
      const currentUser = getCurrentMember();
      const params = new URLSearchParams();
      if (currentUser?.id) {
        params.append('currentUserId', currentUser.id);
      }
      const response = await fetch(`/api/chat-rooms/${chatRoom.id}/messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  // Fetch all members for the member list
  const { data: allMembers = [] } = useQuery<Member[]>({
    queryKey: ['/api/members'],
  });

  // Use WebSocket hook for real-time messages
  const { messages, setMessages, isConnected, sendMessage, deleteMessage } = useChat(chatRoom.id);
  const currentUser = getCurrentMember();

  // Like/Unlike message function
  const handleLikeMessage = async (messageId: string, isCurrentlyLiked: boolean) => {
    if (!currentUser?.id) return;

    try {
      const url = `/api/messages/${messageId}/like`;
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: currentUser.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      // Update the messages to reflect the new like status
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                likeCount: isCurrentlyLiked ? msg.likeCount - 1 : msg.likeCount + 1,
                isLikedByCurrentUser: !isCurrentlyLiked
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };


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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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
    const objectPathRegex = /\/objects\/[^\s]+/gi;
    
    const webUrls = messageText.match(imageRegex) || [];
    const objectPaths = messageText.match(objectPathRegex) || [];
    
    return [...webUrls, ...objectPaths];
  };

  const detectVideoUrls = (messageText: string) => {
    const videoUrls: Array<{ url: string; platform: string; videoId: string; thumbnail: string }> = [];
    
    // YouTube detection
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
    let match;
    while ((match = youtubeRegex.exec(messageText)) !== null) {
      videoUrls.push({
        url: match[0],
        platform: 'YouTube',
        videoId: match[1],
        thumbnail: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
      });
    }
    
    // Vimeo detection
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/gi;
    while ((match = vimeoRegex.exec(messageText)) !== null) {
      videoUrls.push({
        url: match[0],
        platform: 'Vimeo',
        videoId: match[1],
        thumbnail: `https://vumbnail.com/${match[1]}.jpg`
      });
    }
    
    return videoUrls;
  };

  return (
    <div className="flex h-full">
      {/* Member List Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col">
        {/* Member List Header */}
        <div className="border-b border-gray-800 p-4">
          <h4 className="text-sm font-semibold text-white mb-1">Members</h4>
          <p className="text-xs text-gray-400">{allMembers.length} registered</p>
        </div>
        
        {/* Member List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {allMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/50 transition-colors cursor-pointer"
                onDoubleClick={() => {
                  window.open(`/members/${member.id}/profile`, '_blank');
                }}
                title="Double-click to view profile"
              >
                <div className="w-6 h-6 bg-racing-green rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {member.gamertag.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium truncate ${
                        member.isAdmin ? 'text-orange-400' : 'text-white'
                      }`}
                    >
                      {member.gamertag}
                    </span>
                    {member.isAdmin && (
                      <Crown className="w-3 h-3 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {member.experienceLevel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
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
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4 max-w-none">
            {messages.map((message) => (
            <div key={message.id} className="flex gap-3 w-full max-w-4xl py-2">
              <div className="flex-shrink-0">
                <span className="text-xs font-semibold text-white mr-2">
                  {message.member.gamertag.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span 
                    className={`font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity ${
                      message.member.isAdmin 
                        ? "text-orange-400" 
                        : "text-white"
                    }`}
                    onDoubleClick={() => {
                      window.open(`/members/${message.member.id}/profile`, '_blank');
                    }}
                    title="Double-click to view profile"
                  >
                    {message.member.gamertag}
                  </span>
                  {message.member.isAdmin && (
                    <Crown className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-xs text-gray-400">
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {/* Delete button for admin only - visible on mobile */}
                  {(currentUser?.isAdmin || currentUser?.gamertag === 'CJ DirtyEwok') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 ml-auto sm:ml-2 hover:bg-red-600 hover:text-white opacity-70 hover:opacity-100 touch-manipulation"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const success = await deleteMessage(message.id);
                          if (!success) {
                            console.error('Failed to delete message');
                          }
                        } catch (error) {
                          console.error('Delete message error:', error);
                        }
                      }}
                      title="Delete message"
                      data-testid="button-delete-message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="text-gray-300 w-full">
                  {/* Only show text if there are no images or if text has content beyond image URLs */}
                  {(() => {
                    const imageUrls = detectImageUrls(message.message);
                    const messageWithoutImages = imageUrls.reduce((text, url) => text.replace(url, '').trim(), message.message);
                    
                    return messageWithoutImages && (
                      <p className="mb-2 break-words overflow-wrap-anywhere">
                        {renderMessageWithMentions(messageWithoutImages)}
                      </p>
                    );
                  })()}
                  
                  {/* Show embedded images */}
                  {detectImageUrls(message.message).map((imageUrl, imgIndex) => (
                    <div key={imgIndex} className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Shared image"
                        className="max-w-20 sm:max-w-32 md:max-w-48 lg:max-w-xs w-auto max-h-20 sm:max-h-32 md:max-h-48 lg:max-h-64 rounded border border-gray-700 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        onClick={() => {
                          window.open(imageUrl, '_blank');
                        }}
                        title="Click to view full size"
                      />
                    </div>
                  ))}

                  {/* Like button and count */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 gap-1 hover:bg-gray-800 transition-colors ${
                        message.isLikedByCurrentUser 
                          ? 'text-red-500 hover:text-red-400' 
                          : 'text-gray-400 hover:text-red-400'
                      }`}
                      onClick={() => handleLikeMessage(message.id, message.isLikedByCurrentUser)}
                      disabled={!currentUser?.id}
                      title={message.isLikedByCurrentUser ? "Unlike message" : "Like message"}
                      data-testid="button-like-message"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          message.isLikedByCurrentUser ? 'fill-current' : ''
                        }`} 
                      />
                      {message.likeCount > 0 && (
                        <span className="text-xs">{message.likeCount}</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>
      </div>

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
            <ObjectUploader
              onComplete={(imageUrl) => {
                setMessageText(prev => prev + ` ${imageUrl}`);
              }}
              buttonClassName="h-10 w-10 p-0 bg-gray-700 hover:bg-gray-600"
            >
              <Image className="w-4 h-4" />
            </ObjectUploader>
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
    </div>
  );
}