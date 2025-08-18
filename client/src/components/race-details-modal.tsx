import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Car, Users, Clock, Calendar, Trophy } from "lucide-react";
import type { RaceWithStats } from "@shared/schema";

interface RaceDetailsModalProps {
  race: RaceWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister: (race: RaceWithStats) => void;
  onUnregister: (raceId: string) => void;
}

export default function RaceDetailsModal({ 
  race, 
  isOpen, 
  onClose, 
  onRegister, 
  onUnregister 
}: RaceDetailsModalProps) {
  if (!race) return null;

  const raceDate = new Date(race.date);
  const deadlineDate = new Date(race.registrationDeadline);
  const isDeadlinePassed = new Date() > deadlineDate;
  const isFull = race.registeredCount >= race.maxParticipants;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{race.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Race Status */}
          <div className="flex justify-center">
            {race.isRegistered ? (
              <div className="bg-orange-900 border border-orange-500 rounded-lg px-4 py-2">
                <span className="text-orange-400 font-medium">✓ You're Registered!</span>
              </div>
            ) : isDeadlinePassed ? (
              <div className="bg-gray-700 border border-gray-500 rounded-lg px-4 py-2">
                <span className="text-gray-400 font-medium">Registration Closed</span>
              </div>
            ) : isFull ? (
              <div className="bg-red-900 border border-red-500 rounded-lg px-4 py-2">
                <span className="text-red-400 font-medium">Race Full</span>
              </div>
            ) : (
              <div className="bg-racing-green bg-opacity-20 border border-racing-green rounded-lg px-4 py-2">
                <span className="text-racing-green font-medium">Registration Open</span>
              </div>
            )}
          </div>

          {/* Race Details */}
          <div className="space-y-4">
            <div className="flex items-center text-gray-300">
              <Calendar className="w-5 h-5 mr-3 text-racing-green" />
              <div>
                <div className="font-medium text-white">
                  {raceDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-gray-400">
                  {raceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex items-center text-gray-300">
              <MapPin className="w-5 h-5 mr-3 text-racing-green" />
              <div>
                <div className="font-medium text-white">{race.track}</div>
                <div className="text-sm text-gray-400">Track Location</div>
              </div>
            </div>

            <div className="flex items-center text-gray-300">
              <Car className="w-5 h-5 mr-3 text-racing-green" />
              <div>
                <div className="font-medium text-white">{race.carClass}</div>
                <div className="text-sm text-gray-400">Car Class</div>
              </div>
            </div>

            <div className="flex items-center text-gray-300">
              <Users className="w-5 h-5 mr-3 text-racing-green" />
              <div>
                <div className="font-medium text-white">
                  {race.registeredCount} / {race.maxParticipants} registered
                </div>
                <div className="text-sm text-gray-400">
                  {race.maxParticipants - race.registeredCount} spots remaining
                </div>
              </div>
            </div>

            <div className="flex items-center text-gray-300">
              <Clock className="w-5 h-5 mr-3 text-racing-green" />
              <div>
                <div className="font-medium text-white">
                  {deadlineDate.toLocaleDateString()} at {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-400">Registration deadline</div>
              </div>
            </div>
          </div>

          {/* Registration Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Registration Progress</span>
              <span>{Math.round((race.registeredCount / race.maxParticipants) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-racing-green h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(race.registeredCount / race.maxParticipants) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 border-gray-600"
            >
              Close
            </Button>
            
            {race.isRegistered ? (
              <Button
                onClick={() => {
                  onUnregister(race.id);
                  onClose();
                }}
                className="flex-1 bg-racing-red hover:bg-red-600 text-white"
              >
                Unregister
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onRegister(race);
                  onClose();
                }}
                disabled={isDeadlinePassed || isFull}
                className="flex-1 bg-racing-green hover:bg-green-600 text-white disabled:opacity-50"
              >
                {isDeadlinePassed ? "Registration Closed" : isFull ? "Race Full" : "Register Now"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}