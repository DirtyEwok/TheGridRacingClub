import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Clock } from "lucide-react";
import type { RegistrationWithMember, RaceWithStats } from "@shared/schema";

interface RaceDriversModalProps {
  race: RaceWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RaceDriversModal({ race, isOpen, onClose }: RaceDriversModalProps) {
  const { data: drivers = [], isLoading } = useQuery<RegistrationWithMember[]>({
    queryKey: ["/api/races", race?.id, "drivers"],
    queryFn: async () => {
      if (!race) return [];
      const response = await fetch(`/api/races/${race.id}/drivers`, {
        headers: { Authorization: "admin" }
      });
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return response.json();
    },
    enabled: !!race && isOpen,
  });

  if (!race) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Registered Drivers - {race.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Race Info Summary */}
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-racing-green" />
                  <span className="text-gray-300">Track:</span>
                  <span className="text-white">{race.track}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-racing-green" />
                  <span className="text-gray-300">Registered:</span>
                  <span className="text-white">{drivers.length}/{race.maxParticipants}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-racing-green" />
                  <span className="text-gray-300">Car Class:</span>
                  <span className="text-white">{race.carClass}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drivers List */}
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading drivers...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No drivers registered yet</div>
            ) : (
              <div className="space-y-3">
                {drivers.map((registration, index) => (
                  <Card key={registration.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-racing-green rounded-full flex items-center justify-center text-black font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {registration.member?.displayName || "Unknown Driver"}
                            </h3>
                            <p className="text-sm text-gray-300">
                              Gamertag: {registration.member?.gamertag || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className="border-racing-green text-racing-green"
                          >
                            {registration.member?.experienceLevel || "Unknown"}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            Registered: {new Date(registration.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}