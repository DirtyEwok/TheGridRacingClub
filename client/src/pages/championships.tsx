import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Users, Plus, Medal } from "lucide-react";
import MemberHeader from "@/components/member-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChampionshipWithStats } from "@shared/schema";

export default function Championships() {
  const { data: championships = [], isLoading } = useQuery<ChampionshipWithStats[]>({
    queryKey: ["/api/championships"],
    queryFn: async () => {
      const response = await fetch("/api/championships");
      if (!response.ok) throw new Error("Failed to fetch championships");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen carbon-fiber">
        <MemberHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-white">Loading championships...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-fiber">
      <MemberHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Championships and Club Rules</h1>
          <p className="text-gray-300">View active racing championships, seasons, and club regulations</p>
        </div>

        {/* Club Rules Card */}
        <Card className="bg-blue-900 border-blue-700 hover:border-blue-500 transition-colors mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Club Rules & Regulations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-4">
              <p className="text-blue-300 font-medium">Essential guidelines for all Grid Racing Club members:</p>
              
              {/* Document Links */}
              <div className="bg-blue-800 rounded-lg p-4 space-y-3">
                <div>
                  <a 
                    href="https://docs.google.com/document/d/1gd3zZD4ZfmqpluwsHoibrjJ6MCsCoj4bomb2yIGkrQI/edit?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors"
                  >
                    Club Rules
                  </a>
                </div>
                <div>
                  <a 
                    href="https://docs.google.com/document/d/1i05Wd_TffL9HhO04ZdhJDe3420H12tLnUnWsmIf8li0/edit?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors"
                  >
                    Race review and appeal guide
                  </a>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Racing Conduct</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Clean racing at all times</li>
                    <li>• Respect other drivers</li>
                    <li>• Follow race director instructions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Registration</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Register before deadline</li>
                    <li>• Commit to races you join</li>
                    <li>• Notify if unable to attend</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {championships.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="w-12 h-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Championships Yet</h3>
              <p className="text-gray-400 mb-4">
                Championships will appear here once they're created by the admin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {championships.map((championship) => {
              const startDate = new Date(championship.startDate);
              const endDate = new Date(championship.endDate);
              const now = new Date();
              const isActive = now >= startDate && now <= endDate;
              const hasStarted = now >= startDate;
              const hasEnded = now > endDate;
              
              return (
                <Card key={championship.id} className="bg-gray-800 border-gray-700 hover:border-racing-green transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-racing-green" />
                            {championship.name}
                          </CardTitle>
                          <Badge 
                            variant={isActive ? "default" : hasEnded ? "secondary" : "outline"}
                            className={
                              isActive 
                                ? "bg-racing-green text-white" 
                                : hasEnded 
                                  ? "bg-gray-600 text-gray-300" 
                                  : "border-yellow-500 text-yellow-500"
                            }
                          >
                            {isActive ? "Active" : hasEnded ? "Completed" : "Upcoming"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{championship.season}</p>
                        {championship.description && (
                          <div className="text-gray-300 mb-4">
                            {championship.description.split('\n').map((line, index) => (
                              <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
                                {line.trim() === '' ? '' : line}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Championship Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <Calendar className="w-5 h-5 text-racing-green mx-auto mb-1" />
                        <div className="text-sm text-gray-400">Duration</div>
                        <div className="text-white font-semibold">
                          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <Medal className="w-5 h-5 text-racing-green mx-auto mb-1" />
                        <div className="text-sm text-gray-400">Races</div>
                        <div className="text-white font-semibold text-lg">{championship.raceCount}</div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <Users className="w-5 h-5 text-racing-green mx-auto mb-1" />
                        <div className="text-sm text-gray-400">Total Registrations</div>
                        <div className="text-white font-semibold text-lg">{championship.totalRegistrations}</div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-3 text-center">
                        <Trophy className="w-5 h-5 text-racing-green mx-auto mb-1" />
                        <div className="text-sm text-gray-400">Max Participants</div>
                        <div className="text-white font-semibold text-lg">
                          {championship.maxParticipants || "Unlimited"}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>


                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">
                        {!hasStarted && (
                          <span>Starts {startDate.toLocaleDateString()}</span>
                        )}
                        {isActive && (
                          <span>Ends {endDate.toLocaleDateString()}</span>
                        )}
                        {hasEnded && (
                          <span>Completed {endDate.toLocaleDateString()}</span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to races filtered by this championship
                          window.location.href = `/races?championship=${championship.id}`;
                        }}
                        className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                      >
                        View Races
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}