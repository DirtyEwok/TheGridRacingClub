import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getCurrentMember } from "@/lib/memberSession";
import homeImage from "@assets/MAIN CLUB POSTERS-16_1756494139377.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showRegistration, setShowRegistration] = useState(false);
  
  console.log('🏠 Home component loading...');
  const currentMember = getCurrentMember();
  console.log('🏠 Current member:', currentMember ? `${currentMember.gamertag} (${currentMember.id})` : 'null');

  useEffect(() => {
    if (currentMember) {
      // User has a profile, show poster and redirect as normal
      const timeout = setTimeout(() => {
        console.log('🏠 Home page redirecting to chat');
        setLocation("/chat");
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      // Show both options immediately after poster
      const timeout = setTimeout(() => {
        setShowRegistration(true);
      }, 3000);
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
                Join races, chat with other drivers, and compete in championships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setLocation("/signin")} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg"
                data-testid="button-sign-in"
              >
                🏁 SIGN IN (Existing Driver)
              </Button>
              <Button 
                onClick={() => setLocation("/register")} 
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 text-lg"
                data-testid="button-create-profile"
              >
                Create New Driver Profile
              </Button>
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-400">
                  <strong>New Driver?</strong> Create a profile to get started
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Returning Driver?</strong> Sign in with your gamertag
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
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
      
      {/* Skip button for immediate access */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <Button
          onClick={() => setShowRegistration(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-semibold"
          data-testid="button-skip"
        >
          Enter Racing Club
        </Button>
      </div>
    </div>
  );
}