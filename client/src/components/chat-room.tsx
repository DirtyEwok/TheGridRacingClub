import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Crown } from "lucide-react";
import { format } from "date-fns";
import { useChat } from "@/hooks/useChat";
import { type ChatRoom, type ChatMessageWithMember } from "@shared/schema";

interface ChatRoomProps {
  chatRoom: ChatRoom;
  currentMemberId: string;
}

export default function ChatRoomComponent({ chatRoom, currentMemberId }: ChatRoomProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch initial messages
  const { data: initialMessages } = useQuery<ChatMessageWithMember[]>({
    queryKey: ['/api/chat-rooms', chatRoom.id, 'messages'],
  });

  // Use WebSocket hook for real-time messages
  const { messages, setMessages, isConnected, sendMessage } = useChat(chatRoom.id);

  // Set initial messages when they load
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

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
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
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
                  <span className={`font-semibold px-2 py-1 rounded text-sm ${
                    message.member.isAdmin 
                      ? "bg-orange-500 text-white" 
                      : "text-white"
                  }`}>
                    {message.member.gamertag}
                  </span>
                  {message.member.isAdmin && (
                    <Crown className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-xs text-gray-400">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                <p className="text-gray-300 break-words">{message.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
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
        </form>
        <p className="text-xs text-gray-500 mt-1">
          {messageText.length}/500 characters
        </p>
      </div>
    </div>
  );
}