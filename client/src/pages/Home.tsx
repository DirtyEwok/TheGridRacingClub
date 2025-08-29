import { useEffect } from "react";
import { useLocation } from "wouter";
import homeImage from "@assets/MAIN CLUB POSTERS-16_1756494139377.png";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLocation("/races");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center">
        <img 
          src={homeImage} 
          alt="The Grid E-Sports - Chat, Race, Run, Gun & Socialise #RACEANDRESPECT" 
          className="w-full h-full object-contain"
          data-testid="img-home-poster"
        />
      </div>
    </div>
  );
}