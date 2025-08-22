import MemberHeader from "@/components/member-header";
import { Trophy, Medal, Award } from "lucide-react";

export default function Leaderboards() {
  console.log('Leaderboards component rendering');
  return (
    <div className="min-h-screen bg-black">
      <MemberHeader />
      <div style={{ border: '2px solid red', padding: '10px' }}>DEBUG: Navigation should appear above this red box</div>
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
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Trophy className="h-8 w-8 text-racing-green" />
              <h2 className="text-2xl font-bold text-white">GT3 Mid Evo Masters</h2>
            </div>
            <div className="text-center text-gray-400 py-8">
              <Award className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Championship results will appear here after races are completed.</p>
            </div>
          </div>

          {/* GT4 Mornings Season 2 Leaderboard */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Medal className="h-8 w-8 text-racing-green" />
              <h2 className="text-2xl font-bold text-white">GT4 Mornings Season 2</h2>
            </div>
            <div className="text-center text-gray-400 py-8">
              <Award className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Championship results will appear here after races are completed.</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Driver Statistics</h2>
          <div className="text-center text-gray-400 py-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">
              Individual driver stats and race history will be displayed here once the season begins.
            </p>
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