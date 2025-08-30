import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getCurrentMember } from "@/lib/memberSession";
import homeImage from "@assets/MAIN CLUB POSTERS-16_1756494139377.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showRegistration, setShowRegistration] = useState(false);
  
  // Temporarily simulate new user for demonstration - remove after screenshot
  const currentMember = null; // getCurrentMember();

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
      <div className="min-h-screen bg-black relative flex items-center justify-center">
        {/* Background splash screen */}
        <div className="absolute inset-0 flex items-center justify-center p-4 opacity-30">
          <img 
            src={homeImage} 
            alt="The Grid E-Sports - Chat, Race, Run, Gun & Socialise #RACEANDRESPECT" 
            className="w-full h-full max-w-4xl max-h-[90vh] object-contain"
          />
        </div>
        
        {/* Registration overlay */}
        <div className="relative z-10 p-4 w-full max-w-md">
          <Card className="bg-gray-900/95 border-orange-600 shadow-2xl backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl mb-2">Welcome to The Grid Racing Club</CardTitle>
              <CardDescription className="text-gray-300">
                Create your driver profile to join races, chat with other drivers, and compete in championships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setLocation("/register")} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg"
                data-testid="button-create-profile"
              >
                Create Driver Profile
              </Button>
              <p className="text-xs text-gray-400 text-center">
                New drivers must create a profile before accessing races and chat features.
              </p>
            </CardContent>
          </Card>
        </div>
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