import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import RaceCard from "@/components/race-card";
import RegistrationModal from "@/components/registration-modal";
import RaceCalendar from "@/components/race-calendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RaceWithStats } from "@shared/schema";

// For demo purposes, using a mock member ID
// In a real app, this would come from authentication
const MOCK_MEMBER_ID = "demo-member";

export default function Dashboard() {
  const [selectedRace, setSelectedRace] = useState<RaceWithStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: races = [], isLoading } = useQuery<RaceWithStats[]>({
    queryKey: ["/api/races"],
    queryFn: async () => {
      const response = await fetch(`/api/races?memberId=${MOCK_MEMBER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch races");
      return response.json();
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (raceId: string) => {
      const response = await apiRequest("DELETE", `/api/registrations/${raceId}/${MOCK_MEMBER_ID}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      toast({
        title: "Unregistered Successfully",
        description: "You have been removed from the race.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Unregistration Failed",
        description: error.message || "Failed to unregister from race.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = (race: RaceWithStats) => {
    setSelectedRace(race);
    setIsModalOpen(true);
  };

  const handleUnregister = async (raceId: string) => {
    unregisterMutation.mutate(raceId);
  };

  const registeredRaces = races.filter(race => race.isRegistered);
  const totalWins = 12; // Mock data - would come from member profile in real app

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="racing-gradient rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome back, <span className="text-racing-green">RacerPro2023</span>!
                </h2>
                <p className="text-gray-300">Ready to hit the track? Check out upcoming races below.</p>
              </div>
              <div className="flex space-x-6 text-center">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-racing-green">{registeredRaces.length}</div>
                  <div className="text-sm text-gray-400">Registered</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{totalWins}</div>
                  <div className="text-sm text-gray-400">Wins</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Race Listings */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Upcoming Races</h2>
            <Button className="bg-racing-green hover:bg-green-600 text-white">
              <Plus className="mr-2 w-4 h-4" />
              Create Race
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
              />
            ))}
          </div>
        </section>

        {/* Race Calendar */}
        <RaceCalendar races={races} />

        {/* Registration Modal */}
        <RegistrationModal
          race={selectedRace}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRace(null);
          }}
        />
      </main>
    </div>
  );
}
