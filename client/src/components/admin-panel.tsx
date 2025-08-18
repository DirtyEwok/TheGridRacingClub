import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Calendar, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CreateRaceModal from "@/components/create-race-modal";
import CreateChampionshipModal from "@/components/create-championship-modal";
import EditChampionshipModal from "@/components/edit-championship-modal";
import EditRaceModal from "@/components/edit-race-modal";
import type { RaceWithStats, ChampionshipWithStats } from "@shared/schema";

export default function AdminPanel() {
  const [isCreateRaceModalOpen, setIsCreateRaceModalOpen] = useState(false);
  const [isCreateChampionshipModalOpen, setIsCreateChampionshipModalOpen] = useState(false);
  const [editingRace, setEditingRace] = useState<RaceWithStats | null>(null);
  const [editingChampionship, setEditingChampionship] = useState<ChampionshipWithStats | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: races = [], isLoading } = useQuery<RaceWithStats[]>({
    queryKey: ["/api/races"],
    queryFn: async () => {
      const response = await fetch("/api/races");
      if (!response.ok) throw new Error("Failed to fetch races");
      return response.json();
    },
  });

  const { data: championships = [], isLoading: isLoadingChampionships } = useQuery<ChampionshipWithStats[]>({
    queryKey: ["/api/championships"],
    queryFn: async () => {
      const response = await fetch("/api/championships");
      if (!response.ok) throw new Error("Failed to fetch championships");
      return response.json();
    },
  });

  const deleteRaceMutation = useMutation({
    mutationFn: async (raceId: string) => {
      const response = await apiRequest("DELETE", `/api/races/${raceId}`, undefined, {
        headers: { Authorization: "admin" }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      toast({
        title: "Race Deleted",
        description: "The race has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Race",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteChampionshipMutation = useMutation({
    mutationFn: async (championshipId: string) => {
      const response = await apiRequest("DELETE", `/api/championships/${championshipId}`, undefined, {
        headers: { Authorization: "admin" }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/championships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/races"] }); // Refresh races as they may be affected
      toast({
        title: "Championship Deleted",
        description: "The championship has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Championship",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteRace = (race: RaceWithStats) => {
    if (confirm(`Are you sure you want to delete "${race.name}"? This will also remove all registrations.`)) {
      deleteRaceMutation.mutate(race.id);
    }
  };

  const handleDeleteChampionship = (championship: ChampionshipWithStats) => {
    if (confirm(`Are you sure you want to delete "${championship.name}"? This will remove the championship from all associated races.`)) {
      deleteChampionshipMutation.mutate(championship.id);
    }
  };

  if (isLoading || isLoadingChampionships) {
    return (
      <div className="p-6">
        <div className="text-white">Loading admin panel...</div>
      </div>
    );
  }

  const activeRaces = races.filter(race => race.isActive);
  const totalRegistrations = races.reduce((sum, race) => sum + race.registeredCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Races</CardTitle>
            <Calendar className="h-4 w-4 text-racing-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeRaces.length}</div>
            <p className="text-xs text-gray-400">Active racing events</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-racing-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalRegistrations}</div>
            <p className="text-xs text-gray-400">Across all races</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg. Registration</CardTitle>
            <Users className="h-4 w-4 text-racing-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {activeRaces.length > 0 ? Math.round(totalRegistrations / activeRaces.length) : 0}
            </div>
            <p className="text-xs text-gray-400">Per race</p>
          </CardContent>
        </Card>
      </div>

      {/* Race Management */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-white">Race Management</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsCreateRaceModalOpen(true)}
                className="bg-racing-green hover:bg-green-600 text-white"
              >
                <Plus className="mr-2 w-4 h-4" />
                Create Race
              </Button>
              <Button 
                onClick={() => setIsCreateChampionshipModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Trophy className="mr-2 w-4 h-4" />
                Create Championship
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {races.map((race) => {
              const raceDate = new Date(race.date);
              const deadlineDate = new Date(race.registrationDeadline);
              const isDeadlinePassed = new Date() > deadlineDate;
              
              return (
                <div 
                  key={race.id} 
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{race.name}</h3>
                      <Badge variant={race.isActive ? "default" : "secondary"}>
                        {race.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {race.isRegistered && (
                        <Badge className="bg-orange-500">Registered</Badge>
                      )}
                      {isDeadlinePassed && (
                        <Badge variant="destructive">Closed</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>{race.track} • {race.carClass}</div>
                      <div>
                        {raceDate.toLocaleDateString()} at {raceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>{race.registeredCount}/{race.maxParticipants} registered</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRace(race)}
                      className="bg-gray-600 hover:bg-gray-500 border-gray-500"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRace(race)}
                      className="bg-red-900 hover:bg-red-800 border-red-700 text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {races.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No races created yet. Click "Create Race" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Championship Management */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-racing-green" />
            Championship Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {championships.map((championship) => {
              const startDate = new Date(championship.startDate);
              const endDate = new Date(championship.endDate);
              const now = new Date();
              const isActive = now >= startDate && now <= endDate;
              
              return (
                <div 
                  key={championship.id} 
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{championship.name}</h3>
                      <Badge 
                        variant={isActive ? "default" : "secondary"}
                        className={isActive ? "bg-racing-green" : ""}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>{championship.season}</div>
                      <div>
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                      </div>
                      <div>{championship.raceCount} races • {championship.totalRegistrations} total registrations</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingChampionship(championship)}
                      className="bg-gray-600 hover:bg-gray-500 border-gray-500"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChampionship(championship)}
                      className="bg-red-900 hover:bg-red-800 border-red-700 text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {championships.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No championships created yet. Click "Create Championship" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateRaceModal 
        isOpen={isCreateRaceModalOpen}
        onClose={() => setIsCreateRaceModalOpen(false)}
      />

      <CreateChampionshipModal 
        isOpen={isCreateChampionshipModalOpen}
        onClose={() => setIsCreateChampionshipModalOpen(false)}
      />

      <EditChampionshipModal 
        championship={editingChampionship}
        isOpen={!!editingChampionship}
        onClose={() => setEditingChampionship(null)}
      />
      
      <EditRaceModal 
        race={editingRace}
        isOpen={!!editingRace}
        onClose={() => setEditingRace(null)}
      />
    </div>
  );
}