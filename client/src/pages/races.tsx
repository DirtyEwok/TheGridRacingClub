import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

import MemberHeader from "@/components/member-header";
import RaceCard from "@/components/race-card";
import RegistrationModal from "@/components/registration-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentMemberId } from "@/lib/memberSession";
import championship1Image from "@assets/championship1.png";
import championship2Image from "@assets/championship2.png";
import xboxSeriesXLogo from "@assets/4c1488526880b575b0a40944ea1f13d2 - Copy (2)_1756046859441.jpg";
import xboxSeriesSLogo from "@assets/4c1488526880b575b0a40944ea1f13d2_1756046859441.jpg";
import type { RaceWithStats } from "@shared/schema";

export default function Races() {
  const [selectedRace, setSelectedRace] = useState<RaceWithStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Extract championship filter from URL
  const championshipFilter = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('championship');
  }, [location]);

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

  // Filter races by championship if specified
  const filteredRaces = useMemo(() => {
    if (!championshipFilter) return races;
    return races.filter(race => race.championshipId === championshipFilter);
  }, [races, championshipFilter]);

  // Get championship info for display
  const { data: championships = [] } = useQuery({
    queryKey: ["/api/championships"],
    queryFn: async () => {
      const response = await fetch("/api/championships");
      if (!response.ok) throw new Error("Failed to fetch championships");
      return response.json();
    },
  });

  const selectedChampionship = useMemo(() => {
    if (!championshipFilter) return null;
    return championships.find((c: any) => c.id === championshipFilter);
  }, [championships, championshipFilter]);

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
      <div className="min-h-screen carbon-fiber">
        <MemberHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-fiber">
      <MemberHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {selectedChampionship ? `${selectedChampionship.name} Races` : 'Upcoming Races'}
          </h1>
          <p className="text-gray-300">
            {selectedChampionship 
              ? `View races for ${selectedChampionship.name}` 
              : 'Register for racing events and join the competition'
            }
          </p>
          
          {/* Xbox Logos */}
          <div className="flex justify-center items-center gap-8 mt-6 mb-4">
            <img 
              src={xboxSeriesXLogo} 
              alt="Xbox Series X" 
              className="h-12 object-contain opacity-50"
              style={{ 
                mixBlendMode: 'overlay',
                filter: 'brightness(0.7) contrast(0.9)'
              }}
            />
            <img 
              src={xboxSeriesSLogo} 
              alt="Xbox Series S" 
              className="h-12 object-contain opacity-50"
              style={{ 
                mixBlendMode: 'overlay',
                filter: 'brightness(0.7) contrast(0.9)'
              }}
            />
          </div>
          
          {selectedChampionship && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/races'} 
              className="mt-4 bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
            >
              View All Races
            </Button>
          )}
        </div>

        {/* Main content with championship posters on sides */}
        <div className="flex justify-center items-start space-x-8">
          {/* Left Championship Poster */}
          <div className="hidden lg:block">
            <img 
              src={championship1Image} 
              alt="GT4 Mornings Season 2" 
              className="w-48 h-64 object-contain rounded"
            />
          </div>

          {/* Race Grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 flex-1 max-w-6xl">
            {filteredRaces
              .sort((a, b) => {
                // First sort by round number (championship races first)
                if (a.roundNumber !== null && b.roundNumber !== null) {
                  return a.roundNumber - b.roundNumber;
                }
                if (a.roundNumber !== null && b.roundNumber === null) return -1;
                if (a.roundNumber === null && b.roundNumber !== null) return 1;
                
                // Then by date for non-championship races
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              })
              .map((race) => (
                <RaceCard
                  key={race.id}
                  race={race}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                />
              ))
            }
          </div>

          {/* Right Championship Poster */}
          <div className="hidden lg:block">
            <img 
              src={championship2Image} 
              alt="GT3 Mid Evo Masters 90" 
              className="w-48 h-64 object-contain rounded"
            />
          </div>
        </div>

        {filteredRaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {championshipFilter 
                ? `No races available for ${selectedChampionship?.name || 'this championship'}.`
                : 'No races available at the moment.'
              }
            </p>
            <p className="text-gray-500 mt-2">
              {championshipFilter 
                ? 'Try viewing all races or check back later!'
                : 'Check back later for new racing events!'
              }
            </p>
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
