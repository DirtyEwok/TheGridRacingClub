import { useState, useEffect, useRef } from "react";
import { type Member } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Crown, Trash2, Image, Link, Play, Heart, Pin, PinOff, Reply, BarChart3 } from "lucide-react";
import { ObjectUploader } from "./ObjectUploader";
import { PollCreator } from "./PollCreator";
import { PollDisplay } from "./PollDisplay";
import { format } from "date-fns";
import { useChat } from "@/hooks/useChat";
import { type ChatRoom, type ChatMessageWithMember, type PollWithDetails } from "@shared/schema";
import { getCurrentMember } from "@/lib/memberSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessageWithMember | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if this is the UKAU chat room for special styling
  const isUKAURoom = chatRoom.name === "UKAU Operations" || chatRoom.type === "military";
  
  // Mention autocomplete state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  // Fetch pinned messages
  const { data: pinnedMessages = [], refetch: refetchPinnedMessages } = useQuery<ChatMessageWithMember[]>({
    queryKey: ['/api/chat-rooms', chatRoom.id, 'pinned-messages'],
    queryFn: async () => {
      const currentUser = getCurrentMember();
      const params = new URLSearchParams();
      if (currentUser?.id) {
        params.append('currentUserId', currentUser.id);
      }
      const response = await fetch(`/api/chat-rooms/${chatRoom.id}/pinned-messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch pinned messages');
      return response.json();
    },
  });

  // Fetch all members for the member list
  const { data: allMembers = [] } = useQuery<Member[]>({
    queryKey: ['/api/members'],
  });

  // Fetch polls for this chat room
  const { data: polls = [], refetch: refetchPolls, isLoading: pollsLoading } = useQuery<PollWithDetails[]>({
    queryKey: ['/api/chat-rooms', chatRoom.id, 'polls'],
    queryFn: async () => {
      const currentUser = getCurrentMember();
      const params = new URLSearchParams();
      if (currentUser?.id) {
        params.append('userId', currentUser.id);
      }
      const response = await fetch(`/api/chat-rooms/${chatRoom.id}/polls?${params}`);
      if (!response.ok) throw new Error('Failed to fetch polls');
      const data = await response.json();
      console.log('Polls fetched for room:', chatRoom.id, 'data:', data); // Debug log
      return data;
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  const queryClient = useQueryClient();

  // Vote on poll mutation
  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, memberId: currentMemberId }),
      });
      if (!response.ok) throw new Error('Failed to vote');
      return response.json();
    },
    onSuccess: () => {
      // Refetch polls to update vote counts
      refetchPolls();
    },
  });

  const handleVote = async (pollId: string, optionId: string) => {
    await voteMutation.mutateAsync({ pollId, optionId });
  };

  // Use WebSocket hook for real-time messages
  const { messages, setMessages, isConnected, sendMessage, deleteMessage } = useChat(chatRoom.id);
  
  // Force refresh member data to get updated admin status
  const { data: memberData } = useQuery<Member[]>({
    queryKey: ['/api/members'],
  });
  
  let currentUser = getCurrentMember();
  // Update local storage with fresh admin status from server if available
  if (memberData && currentUser) {
    const freshMemberData = memberData.find(m => m.id === currentUser?.id);
    if (freshMemberData && freshMemberData.isAdmin !== currentUser.isAdmin) {
      // Update session with fresh admin status
      const updatedUser = { ...currentUser, isAdmin: freshMemberData.isAdmin };
      localStorage.setItem("grid-racing-member", JSON.stringify(updatedUser));
      currentUser = updatedUser;
    }
  }

  // Pin/Unpin message function
  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    if (!currentUser?.id || !currentUser.isAdmin) return;

    try {
      const url = `/api/messages/${messageId}/pin`;
      const method = isPinned ? 'DELETE' : 'POST';
      const body = isPinned 
        ? { memberId: currentUser.id }
        : { pinnedBy: currentUser.id };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Refetch pinned messages
        refetchPinnedMessages();
      }
    } catch (error) {
      console.error('Error pinning/unpinning message:', error);
    }
  };

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

  // Filter members for mention autocomplete
  const filteredMembers = allMembers.filter(member => 
    member.gamertag.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    member.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  // Handle input change with mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setMessageText(value);
    
    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Only show dropdown if there's no space after @ and we're right after @
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Handle mention selection
  const selectMention = (member: Member) => {
    if (mentionStartIndex >= 0) {
      const beforeMention = messageText.substring(0, mentionStartIndex);
      const afterMention = messageText.substring(mentionStartIndex + mentionQuery.length + 1);
      const newText = `${beforeMention}@${member.gamertag} ${afterMention}`;
      setMessageText(newText);
      setShowMentionDropdown(false);
      
      // Focus back to input
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPosition = beforeMention.length + member.gamertag.length + 2;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        selectMention(filteredMembers[selectedMentionIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
        return;
      }
    }
    
    // Handle normal Enter to send message
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };


  const handleSendMessage = async (e?: React.FormEvent) => {
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!messageText.trim() || isSending) {
      console.log('🔧 Enter blocked:', { noMessage: !messageText.trim(), isSending });
      return;
    }

    setIsSending(true);
    try {
      console.log('🔧 Enter API call...');
      const response = await fetch(`/api/chat-rooms/${chatRoom.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim(),
          memberId: currentMemberId,
          replyToMessageId: replyingTo?.id || null,
        }),
      });
      
      console.log('🔧 Enter response:', response.status);
      
      if (response.ok) {
        setMessageText("");
        setReplyingTo(null);
        if (onMessageDraftChange) {
          onMessageDraftChange("");
        }
      }
    } catch (error) {
      console.error('🔧 Enter error:', error);
    } finally {
      setTimeout(() => setIsSending(false), 300);
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
              const isEveryoneMention = mentionedGamertag.toLowerCase() === 'everyone';
              
              return (
                <span
                  key={`${urlIndex}-${mentionIndex}`}
                  className={`font-semibold px-1 rounded ${
                    isCurrentUser 
                      ? 'bg-orange-500 text-white' 
                      : isEveryoneMention
                      ? 'bg-red-600 text-white'
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
    
    return [...webUrls, ...objectPaths].filter(url => !isVideoUrl(url));
  };

  // Function to detect video URLs (MP4, etc.)
  const detectVideoUrls = (messageText: string) => {
    const videoRegex = /(https?:\/\/[^\s]+\.(?:mp4|mov|avi|mkv|webm))/gi;
    const objectPathRegex = /\/objects\/[^\s]+/gi;
    
    const webUrls = messageText.match(videoRegex) || [];
    const objectPaths = messageText.match(objectPathRegex) || [];
    
    return [...webUrls, ...objectPaths].filter(url => isVideoUrl(url));
  };

  // Function to check if URL is a video
  const isVideoUrl = (url: string) => {
    // Check for direct video file extensions
    const hasVideoExtension = /\.(mp4|mov|avi|mkv|webm)(\?[^\s]*)?$/i.test(url);
    // For uploaded files, we need to assume /objects/uploads/ paths could be videos
    // since they don't have file extensions in the URL
    const isUploadedFile = url.startsWith('/objects/uploads/');
    
    return hasVideoExtension || isUploadedFile;
  };

  // Function to detect YouTube URLs
  const detectYouTubeUrls = (text: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    const matches = [];
    let match;
    while ((match = youtubeRegex.exec(text)) !== null) {
      matches.push({
        url: match[0],
        videoId: match[1],
        fullMatch: match[0]
      });
    }
    return matches;
  };

  // Function to get YouTube video info
  const getYouTubeVideoInfo = (videoId: string) => {
    return {
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      title: `YouTube Video`,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  };


  return (
    <div className={`flex h-full ${isUKAURoom ? 'camo-background' : ''}`}>
      {/* Member List Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-64 border-r border-gray-800 flex-col">
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
                {chatRoom.type === "general" ? "General Discussion" : 
                 chatRoom.type === "military" ? "Run, gun and blow stuff up" : "Championship Chat"}
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
        <ScrollArea className="h-full">
          <div className="space-y-4 max-w-none p-4">
            {/* Pinned Messages Section */}
            {pinnedMessages.length > 0 && (
              <div className="border-b border-gray-700 pb-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-500">Pinned Messages</span>
                </div>
                <div className="space-y-3">
                  {pinnedMessages.map((message) => (
                    <div key={`pinned-${message.id}`} className="flex gap-3 w-full p-3 bg-gray-800/50 rounded-lg border-l-4 border-orange-500">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-racing-green rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {message.member.gamertag.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span 
                            className={`font-semibold px-2 py-1 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity ${
                              ['CJ DirtyEwok', 'Adzinski82'].includes(message.member.gamertag)
                                ? "text-lime-400" 
                                : ['Alexcdl18', 'Stalker Brown', 'Snuffles 1983', 'Neilb2112'].includes(message.member.gamertag)
                                ? "text-yellow-400"
                                : message.member.isAdmin 
                                ? "text-white" 
                                : "text-white"
                            }`}
                            style={
                              ['CJ DirtyEwok', 'Adzinski82'].includes(message.member.gamertag) ? {} :
                              ['Alexcdl18', 'Stalker Brown', 'Snuffles 1983', 'Neilb2112'].includes(message.member.gamertag) ? {} :
                              message.member.isAdmin ? { backgroundColor: '#f97316' } : {}
                            }
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
                          <Pin className="w-3 h-3 text-orange-500" />
                          {/* Unpin button for admin only */}
                          {currentUser?.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-600 hover:text-white opacity-70 hover:opacity-100"
                              onClick={() => handlePinMessage(message.id, true)}
                              title="Unpin message"
                            >
                              <PinOff className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="text-white text-sm break-words whitespace-pre-wrap">
                          {renderMessageWithMentions(message.message)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Polls */}
            {polls.length > 0 && (
              <div className="px-4">
                {polls.map((poll) => (
                  <PollDisplay
                    key={poll.id}
                    poll={poll}
                    currentMemberId={currentMemberId}
                    onVote={handleVote}
                    onDelete={async (pollId) => {
                      try {
                        const response = await fetch(`/api/polls/${pollId}`, {
                          method: 'DELETE',
                        });
                        if (response.ok) {
                          queryClient.invalidateQueries({ queryKey: ['/api/chat-rooms', chatRoom.id, 'polls'] });
                          refetchPolls();
                        }
                      } catch (error) {
                        console.error('Error deleting poll:', error);
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {/* Regular Messages - Limited to 12 with scrolling */}
            <div className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[750px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {messages.slice(-12).map((message) => (
              <div key={message.id} className="flex gap-3 w-full p-4 max-w-4xl">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-racing-green rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {message.member.gamertag.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span 
                    className={`font-semibold px-2 py-1 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity ${
                      ['CJ DirtyEwok', 'Adzinski82'].includes(message.member.gamertag)
                        ? "text-lime-400" 
                        : ['Alexcdl18', 'Stalker Brown', 'Snuffles 1983', 'Neilb2112'].includes(message.member.gamertag)
                        ? "text-yellow-400"
                        : message.member.isAdmin 
                        ? "text-white" 
                        : "text-white"
                    }`}
                    style={
                      ['CJ DirtyEwok', 'Adzinski82'].includes(message.member.gamertag) ? {} :
                      ['Alexcdl18', 'Stalker Brown', 'Snuffles 1983', 'Neilb2112'].includes(message.member.gamertag) ? {} :
                      message.member.isAdmin ? { backgroundColor: '#f97316' } : {}
                    }
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
                  {/* Reply button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-600 hover:text-white opacity-70 hover:opacity-100"
                    onClick={() => setReplyingTo(message)}
                    title="Reply to message"
                    data-testid="button-reply-message"
                  >
                    <Reply className="w-4 h-4" />
                  </Button>
                  {/* Pin button for admin only */}
                  {currentUser?.isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-orange-600 hover:text-white opacity-70 hover:opacity-100"
                      onClick={() => handlePinMessage(message.id, false)}
                      title="Pin message"
                      data-testid="button-pin-message"
                    >
                      <Pin className="w-4 h-4" />
                    </Button>
                  )}
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
                
                {/* Reply Context Display */}
                {message.replyToMessageId && (() => {
                  const replyToMessage = messages.find(m => m.id === message.replyToMessageId);
                  return replyToMessage ? (
                    <div className="mb-2 pl-4 border-l-2 border-blue-500 bg-gray-800/30 rounded-r p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Reply className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">
                          Replying to {replyToMessage.member.gamertag}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 max-h-12 overflow-hidden">
                        {replyToMessage.message.length > 80 ? 
                          `${replyToMessage.message.substring(0, 80)}...` : 
                          replyToMessage.message
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2 pl-4 border-l-2 border-gray-600 bg-gray-800/30 rounded-r p-2">
                      <div className="flex items-center gap-2">
                        <Reply className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500 font-medium italic">
                          Replied to a deleted message
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="text-gray-300 w-full">
                  {/* Only show text if there are no images/videos or if text has content beyond URLs */}
                  {(() => {
                    const imageUrls = detectImageUrls(message.message);
                    const videoUrls = detectVideoUrls(message.message);
                    const youtubeVideos = detectYouTubeUrls(message.message);
                    let messageWithoutMedia = message.message;
                    
                    // Remove image URLs
                    imageUrls.forEach(url => {
                      messageWithoutMedia = messageWithoutMedia.replace(url, '').trim();
                    });
                    
                    // Remove video URLs
                    videoUrls.forEach(url => {
                      messageWithoutMedia = messageWithoutMedia.replace(url, '').trim();
                    });
                    
                    // Remove YouTube URLs
                    youtubeVideos.forEach(video => {
                      messageWithoutMedia = messageWithoutMedia.replace(video.fullMatch, '').trim();
                    });
                    
                    return messageWithoutMedia && (
                      <p className="mb-2 break-words overflow-wrap-anywhere">
                        {renderMessageWithMentions(messageWithoutMedia)}
                      </p>
                    );
                  })()}
                  
                  {/* Show embedded images */}
                  {detectImageUrls(message.message).map((imageUrl, imgIndex) => (
                    <div key={imgIndex} className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Shared image"
                        className="max-w-32 sm:max-w-40 md:max-w-48 lg:max-w-xs w-auto max-h-32 sm:max-h-40 md:max-h-48 lg:max-h-64 rounded border border-gray-700 object-cover cursor-pointer hover:opacity-90 transition-opacity"
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

                  {/* Show embedded videos */}
                  {detectVideoUrls(message.message).map((videoUrl, videoIndex) => (
                    <div key={videoIndex} className="mt-2">
                      <video
                        controls
                        className="max-w-32 sm:max-w-40 md:max-w-48 lg:max-w-xs w-auto max-h-32 sm:max-h-40 md:max-h-48 lg:max-h-64 rounded border border-gray-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        preload="metadata"
                        title="MP4 Video"
                      >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}

                  {/* Show YouTube video previews */}
                  {detectYouTubeUrls(message.message).map((video, videoIndex) => {
                    const videoInfo = getYouTubeVideoInfo(video.videoId);
                    return (
                      <div key={videoIndex} className="mt-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden max-w-sm">
                        <div className="cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(videoInfo.url, '_blank')}>
                          <div className="relative">
                            <img
                              src={videoInfo.thumbnail}
                              alt="YouTube Video Thumbnail"
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                // If maxresdefault fails, try default thumbnail
                                e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                              }}
                            />
                            {/* YouTube play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-red-600 rounded-full p-3 opacity-90 hover:opacity-100 transition-opacity">
                                <Play className="w-6 h-6 text-white fill-current" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="text-red-600">
                                <Play className="w-4 h-4 fill-current" />
                              </div>
                              <span className="text-sm text-gray-300 font-medium">YouTube Video</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate">{video.url}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

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
            </div>
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-800 p-4">
        {/* Reply Context */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-gray-800 border border-gray-600 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-400 font-medium">
                Replying to {replyingTo.member.gamertag}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-700"
                onClick={() => setReplyingTo(null)}
                title="Cancel reply"
              >
                ×
              </Button>
            </div>
            <div className="text-sm text-gray-300 bg-gray-900 p-2 rounded border-l-4 border-blue-500 max-h-20 overflow-y-auto">
              {replyingTo.message.length > 100 ? 
                `${replyingTo.message.substring(0, 100)}...` : 
                replyingTo.message
              }
            </div>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                id="chat-message-input"
                name="messageText"
                value={messageText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message, paste image URL, or share a link..."
                className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 touch-manipulation"
                maxLength={500}
                disabled={isSending}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-testid="input-chat-message"
              />
              
              {/* Mention Autocomplete Dropdown */}
              {showMentionDropdown && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
                  {filteredMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                        index === selectedMentionIndex ? 'bg-gray-700' : ''
                      }`}
                      onClick={() => selectMention(member)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-white">
                          @{member.gamertag}
                        </div>
                        <div className="text-xs text-gray-400">
                          {member.displayName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ObjectUploader
              onComplete={(imageUrl) => {
                setMessageText(prev => prev + ` ${imageUrl}`);
              }}
              buttonClassName="h-10 w-10 p-0 bg-gray-700 hover:bg-gray-600"
            >
              <Image className="w-4 h-4" />
            </ObjectUploader>
            <PollCreator
              chatRoomId={chatRoom.id}
              currentMemberId={currentMemberId}
              onPollCreated={() => {
                // Invalidate and refetch polls
                queryClient.invalidateQueries({ queryKey: ['/api/chat-rooms', chatRoom.id, 'polls'] });
                refetchPolls();
              }}
            >
              <button
                type="button"
                className="h-10 w-10 p-0 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center justify-center touch-manipulation"
                title="Create poll"
                data-testid="button-create-poll"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </PollCreator>
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="bg-racing-green hover:bg-racing-green/80 rounded-md p-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              onClick={(e) => {
                e.preventDefault();
                handleSendMessage(e);
              }}
              title="Send message"
              data-testid="button-send-message"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
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