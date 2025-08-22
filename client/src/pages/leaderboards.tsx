import MemberHeader from "@/components/member-header";
import { Trophy, Medal, Award } from "lucide-react";
import gt4LeaderboardImage from "@assets/gt4redbull_1755878317150.png";

export default function Leaderboards() {
  return (
    <div className="min-h-screen bg-black">
      <MemberHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            <span className="text-racing-green">Current Standings</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Track your performance and see how you rank against other drivers in The Grid Racing Club.
          </p>
        </div>

        {/* Championship Leaderboards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* GT3 Mid Evo Masters Leaderboard */}
          <div>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Trophy className="h-8 w-8 text-racing-green" />
              <h2 className="text-2xl font-bold text-white">GT3 Mid Evo Masters</h2>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
              <div className="text-center text-gray-400 py-8">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">Championship results will appear here after races are completed.</p>
              </div>
            </div>
          </div>

          {/* GT4 Mornings Season 2 Leaderboard */}
          <div>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Medal className="h-8 w-8 text-racing-green" />
              <h2 className="text-2xl font-bold text-white">GT4 Mornings Season 2</h2>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-center">
                <img 
                  src={gt4LeaderboardImage} 
                  alt="GT4 Mornings Season 2 Leaderboard" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>



        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="text-racing-green font-semibold">
            Get racing to see your name on the leaderboards!
          </div>
        </div>
      </div>
    </div>
  );
}