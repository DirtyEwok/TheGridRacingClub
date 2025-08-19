import { useState } from "react";
import { Trophy, MapPin, Car, Users, Clock, CheckCircle, Info, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import CircuitPreview from "./circuit-preview";
import type { RaceWithStats } from "@shared/schema";

interface RaceCardProps {
  race: RaceWithStats;
  onRegister: (race: RaceWithStats) => void;
  onUnregister: (raceId: string) => void;
}

export default function RaceCard({ race, onRegister, onUnregister }: RaceCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const raceDate = new Date(race.date);
  const isDeadlinePassed = new Date() > new Date(race.registrationDeadline);
  const isFull = race.registeredCount >= race.maxParticipants;
  const fillPercentage = (race.registeredCount / race.maxParticipants) * 100;

  const getStatusBadge = () => {
    if (race.isRegistered) {
      return { text: "REGISTERED", color: "bg-orange-500", icon: CheckCircle };
    }
    if (isDeadlinePassed || isFull) {
      return { text: "CLOSED", color: "bg-gray-500", icon: Clock };
    }
    if (race.timeUntilDeadline === "< 1 hour" || race.timeUntilDeadline?.includes("hour")) {
      return { text: "CLOSING SOON", color: "bg-yellow-500", icon: Clock };
    }
    return { text: "OPEN", color: "bg-racing-green", icon: Trophy };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  const getBorderColor = () => {
    if (race.isRegistered) return "border-orange-500 hover:border-orange-400";
    if (status.color === "bg-yellow-500") return "border-yellow-500 hover:border-yellow-400";
    return "border-gray-700 hover:border-racing-green";
  };

  return (
    <div className={`bg-gray-800 rounded-xl border transition-colors ${getBorderColor()}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <StatusIcon className="text-lg mr-2" style={{ color: status.color.replace('bg-', '') }} />
            <span className={`${status.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
              {status.text}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
              title="View Circuit Preview"
            >
              <Eye className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
            </button>
            <div className="text-right text-sm text-gray-400">
              <div>{raceDate.toLocaleDateString("en-GB", {timeZone: "Europe/London"})}</div>
              <div>{raceDate.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', timeZone: "Europe/London" })}</div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{race.name}</h3>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center text-gray-300">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{race.track}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <Car className="w-4 h-4 mr-2" />
            <span>{race.carClass}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <Users className="w-4 h-4 mr-2" />
            <span>{race.registeredCount}/{race.maxParticipants} registered</span>
          </div>
        </div>

        {status.color === "bg-yellow-500" && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Registration closes in:</span>
              <span className="text-yellow-400 font-medium">{race.timeUntilDeadline}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full" 
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        )}

        {race.isRegistered && (
          <div className="mb-3">
            <div className="bg-orange-900 border border-orange-500 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="text-orange-500 mr-2 w-4 h-4" />
                <span className="text-orange-400 text-sm font-medium">You're registered!</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Grid position will be determined by qualifying</div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {race.isRegistered ? (
            <Button
              onClick={() => onUnregister(race.id)}
              className="flex-1 bg-racing-red hover:bg-red-600 text-white"
            >
              Unregister
            </Button>
          ) : (
            <Button
              onClick={() => onRegister(race)}
              disabled={isDeadlinePassed || isFull}
              className={`flex-1 ${
                status.color === "bg-yellow-500"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                  : "bg-racing-green hover:bg-green-600 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isDeadlinePassed ? "Registration Closed" : isFull ? "Race Full" : "Register Now"}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => alert(`Race Details:\n\n${race.name}\n${race.track}\n${race.carClass}\n\nDate: ${new Date(race.date).toLocaleDateString()}\nTime: ${new Date(race.date).toLocaleTimeString()}\n\nRegistration Deadline: ${new Date(race.registrationDeadline).toLocaleDateString()}\n\nParticipants: ${race.registeredCount}/${race.maxParticipants}`)}
            className="bg-gray-700 hover:bg-gray-600 border-gray-600"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Circuit Preview */}
      {showPreview && (
        <div className="border-t border-gray-700">
          <CircuitPreview 
            trackName={race.track} 
            carClass={race.carClass}
            isVisible={showPreview}
          />
        </div>
      )}
    </div>
  );
}
