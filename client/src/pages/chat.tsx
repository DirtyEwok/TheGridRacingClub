import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MemberHeader from "@/components/member-header";
import ChatRoomComponent from "@/components/chat-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Users, Settings } from "lucide-react";
import { type ChatRoomWithStats, type Championship } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Chat() {
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<string>(""); // This should come from auth context
  const queryClient = useQueryClient();

  // Get current member from localStorage (replace with proper auth later)
  useEffect(() => {
    const member = localStorage.getItem("currentMember");
    if (member) {
      const memberData = JSON.parse(member);
      setCurrentMemberId(memberData.id);
    }
  }, []);

  // Fetch chat rooms
  const { data: chatRooms, isLoading } = useQuery<ChatRoomWithStats[]>({
    queryKey: ['/api/chat-rooms'],
  });

  // Fetch championships for potential new chat rooms
  const { data: championships } = useQuery<Championship[]>({
    queryKey: ['/api/championships'],
  });

  // Create championship chat room mutation
  const createChatRoomMutation = useMutation({
    mutationFn: async (championshipId: string) => {
      const championship = championships?.find(c => c.id === championshipId);
      if (!championship) throw new Error("Championship not found");

      const response = await fetch(`/api/chat-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'admin', // Replace with proper admin auth
        },
        body: JSON.stringify({
          name: `${championship.name} Chat`,
          type: 'championship',
          championshipId: championshipId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat room');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat-rooms'] });
    },
  });

  // Initialize general chat room if none exists
  const initializeGeneralChat = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/chat-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'admin', // Replace with proper admin auth
        },
        body: JSON.stringify({
          name: 'General Discussion',
          type: 'general',
          championshipId: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create general chat');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat-rooms'] });
    },
  });

  // Auto-create general chat if it doesn't exist
  useEffect(() => {
    if (chatRooms && !chatRooms.find(room => room.type === 'general')) {
      initializeGeneralChat.mutate();
    }
  }, [chatRooms]);

  // Auto-select first chat room
  useEffect(() => {
    if (chatRooms && chatRooms.length > 0 && !selectedChatRoom) {
      const generalChat = chatRooms.find(room => room.type === 'general');
      setSelectedChatRoom(generalChat?.id || chatRooms[0].id);
    }
  }, [chatRooms, selectedChatRoom]);

  const selectedRoom = chatRooms?.find(room => room.id === selectedChatRoom);

  // Get championships that don't have chat rooms yet
  const championshipsWithoutChat = championships?.filter(championship => 
    !chatRooms?.some(room => room.championshipId === championship.id)
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <MemberHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-white">Loading chat...</div>
        </div>
      </div>
    );
  }

  if (!currentMemberId) {
    return (
      <div className="min-h-screen bg-black">
        <MemberHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-white">Please register as a member to access chat.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <MemberHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="text-racing-green">The Grid</span> Chat
          </h1>
          <p className="text-gray-300">
            Connect with fellow racers, discuss championships, and share racing tips.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Room List Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat Rooms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1 p-4">
                    {chatRooms?.map((room) => (
                      <Button
                        key={room.id}
                        variant={selectedChatRoom === room.id ? "default" : "ghost"}
                        className={`w-full justify-start text-left h-auto p-3 ${
                          selectedChatRoom === room.id 
                            ? "bg-racing-green text-white" 
                            : "text-gray-300 hover:text-white hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedChatRoom(room.id)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center gap-2 w-full">
                            {room.type === 'general' ? (
                              <Users className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <Settings className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{room.name}</span>
                          </div>
                          {room.lastMessage && (
                            <p className="text-xs text-gray-400 truncate w-full mt-1">
                              {room.lastMessage.member.gamertag}: {room.lastMessage.message}
                            </p>
                          )}
                        </div>
                      </Button>
                    ))}

                    {/* Create championship chat rooms */}
                    {championshipsWithoutChat.length > 0 && (
                      <div className="pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Create Championship Chats:</p>
                        {championshipsWithoutChat.map((championship) => (
                          <Button
                            key={championship.id}
                            variant="outline"
                            size="sm"
                            className="w-full mb-2 text-xs border-gray-600 text-gray-300"
                            onClick={() => createChatRoomMutation.mutate(championship.id)}
                            disabled={createChatRoomMutation.isPending}
                          >
                            + {championship.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-gray-800 h-full">
              {selectedRoom ? (
                <ChatRoomComponent 
                  chatRoom={selectedRoom} 
                  currentMemberId={currentMemberId}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a chat room to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}