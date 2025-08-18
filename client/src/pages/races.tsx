import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import Header from "@/components/header";
import RaceCard from "@/components/race-card";
import RegistrationModal from "@/components/registration-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RaceWithStats } from "@shared/schema";

// For demo purposes, using a mock member ID
const MOCK_MEMBER_ID = "demo-member";

export default function Races() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">The Grid Racing Club</h1>
          <p className="text-gray-300">Browse and register for upcoming racing events</p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
            />
          ))}
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
