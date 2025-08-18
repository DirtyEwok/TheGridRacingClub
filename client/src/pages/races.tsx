import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import MemberHeader from "@/components/member-header";
import RaceCard from "@/components/race-card";
import RegistrationModal from "@/components/registration-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentMemberId } from "@/lib/memberSession";
import championship1Image from "@assets/championship1.png";
import championship2Image from "@assets/championship2.png";
import type { RaceWithStats } from "@shared/schema";

export default function Races() {
  const [selectedRace, setSelectedRace] = useState<RaceWithStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: races = [], isLoading } = useQuery<RaceWithStats[]>({
    queryKey: ["/api/races"],
    queryFn: async () => {
      const memberId = getCurrentMemberId();
      const url = memberId ? `/api/races?memberId=${memberId}` : '/api/races';
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch races");
      return response.json();
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (raceId: string) => {
      const memberId = getCurrentMemberId();
      if (!memberId) throw new Error("No member session found");
      const response = await apiRequest("DELETE", `/api/registrations/${raceId}/${memberId}`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <MemberHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <MemberHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upcoming Races</h1>
          <p className="text-gray-300">Register for racing events and join the competition</p>
        </div>

        {/* Main content with championship posters on sides */}
        <div className="flex justify-center items-start space-x-8">
          {/* Left Championship Poster */}
          <div className="hidden lg:block">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-medium text-gray-300 mb-2 text-center">GT4 Mornings S2</h3>
              <div className="w-32 h-40 rounded border border-gray-600 overflow-hidden">
                <img 
                  src={championship1Image} 
                  alt="GT4 Mornings Season 2" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Race Grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 flex-1 max-w-6xl">
            {races.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
              />
            ))}
          </div>

          {/* Right Championship Poster */}
          <div className="hidden lg:block">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-medium text-gray-300 mb-2 text-center">GT3 Mid Evo Masters</h3>
              <div className="w-32 h-40 rounded border border-gray-600 overflow-hidden">
                <img 
                  src={championship2Image} 
                  alt="GT3 Mid Evo Masters 90" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {races.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No races available at the moment.</p>
            <p className="text-gray-500 mt-2">Check back later for new racing events!</p>
          </div>
        )}

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
