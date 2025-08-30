import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getCurrentMember } from "@/lib/memberSession";
import homeImage from "@assets/MAIN CLUB POSTERS-16_1756494139377.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showRegistration, setShowRegistration] = useState(false);
  const currentMember = getCurrentMember();

  useEffect(() => {
    if (currentMember) {
      // User has a profile, show poster and redirect as normal
      const timeout = setTimeout(() => {
        setLocation("/races");
      }, 5000);
      return () => clearTimeout(timeout);
    } else {
      // New user, show poster for 5 seconds then show registration prompt
      const timeout = setTimeout(() => {
        setShowRegistration(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [setLocation, currentMember]);

  if (showRegistration) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Welcome to The Grid Racing Club</CardTitle>
            <CardDescription className="text-gray-400">
              Create your driver profile to join races, chat with other drivers, and compete in championships.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setLocation("/register")} 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              data-testid="button-create-profile"
            >
              Create Driver Profile
            </Button>
            <p className="text-xs text-gray-500 text-center">
              New drivers must create a profile before accessing races and chat features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center">
        <img 
          src={homeImage} 
          alt="The Grid E-Sports - Chat, Race, Run, Gun & Socialise #RACEANDRESPECT" 
          className="w-full h-full object-contain"
          data-testid="img-home-poster"
        />
        {currentMember && (
          <div className="absolute top-8 right-8 text-white">
            <p className="text-sm opacity-75">Welcome back, {currentMember.gamertag}</p>
          </div>
        )}
      </div>
    </div>
  );
}