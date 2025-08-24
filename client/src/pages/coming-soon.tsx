import comingSoonImage from "@assets/MC9porsche_1756023122999.png";
import comingSoonVideo from "@assets/24-08-25_1756024739066.mp4";
import MemberHeader from "@/components/member-header";
import { useState, useRef } from "react";
import { Play } from "lucide-react";

export default function ComingSoon() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <MemberHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            <span className="text-racing-green">Coming Soon</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Here's what's coming to The Grid Racing Club.
          </p>
          
          {/* Season 9 Details */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-lg text-gray-300 leading-relaxed">
              We return with Season 9 of the Grid's MasterClass and this time its GT2 Porsche 911 RS power.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mt-2">
              Full details will be announced soon.
            </p>
          </div>
          
          {/* Masterclass Season 9 Image */}
          <div className="flex justify-center mb-8">
            <img 
              src={comingSoonImage} 
              alt="Masterclass Season 9 GT2 Porsche - Coming Soon" 
              className="max-w-4xl w-full h-auto rounded-lg shadow-lg border-2 border-racing-green"
            />
          </div>
          
          {/* Masterclass Season 9 Video Preview */}
          <div className="flex justify-center mb-8">
            <div className="relative max-w-4xl w-full">
              <video 
                ref={videoRef}
                src={comingSoonVideo} 
                className="w-full h-auto rounded-lg shadow-lg border-2 border-racing-green"
                controls
                muted
                poster={comingSoonImage}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
              
              {/* Custom Play Button Overlay */}
              {!isVideoPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-lg"
                  onClick={handlePlayVideo}
                >
                  <div className="bg-racing-green/80 hover:bg-racing-green/90 transition-all duration-300 rounded-full p-6 shadow-xl">
                    <Play className="w-16 h-16 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>





        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="text-racing-green font-semibold">
            Keep racing, and stay tuned for updates!
          </div>
        </div>
      </div>
    </div>
  );
}