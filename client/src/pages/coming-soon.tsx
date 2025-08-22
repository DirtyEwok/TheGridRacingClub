import { Calendar, Trophy, Users, Zap } from "lucide-react";

export default function ComingSoon() {
  const features = [
    {
      icon: <Trophy className="h-8 w-8 text-racing-green" />,
      title: "Live Leaderboards",
      description: ""
    },
    {
      icon: <Calendar className="h-8 w-8 text-racing-green" />,
      title: "Season Calendar",
      description: "Complete racing schedule with track previews, weather conditions, and practice times."
    },
    {
      icon: <Users className="h-8 w-8 text-racing-green" />,
      title: "Team Management", 
      description: "Form racing teams, coordinate strategies, and track team performance across championships."
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Exciting Features 
            <span className="text-racing-green"> Coming Soon</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We're working hard to bring you even more tools to enhance your racing experience. 
            Here's what's coming to The Grid Racing Club.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-900 border border-gray-700 rounded-lg p-8 hover:border-racing-green transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Development Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-racing-green rounded-full flex-shrink-0"></div>
              <div className="text-gray-300">
                <span className="font-semibold text-racing-green">Phase 1:</span> Enhanced race registration and member profiles
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-600 rounded-full flex-shrink-0"></div>
              <div className="text-gray-400">
                <span className="font-semibold">Phase 2:</span> Live race results and leaderboard integration
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-600 rounded-full flex-shrink-0"></div>
              <div className="text-gray-400">
                <span className="font-semibold">Phase 3:</span> Team management and advanced analytics
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-600 rounded-full flex-shrink-0"></div>
              <div className="text-gray-400">
                <span className="font-semibold">Phase 4:</span> Mobile app enhancements and push notifications
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-300 text-lg mb-6">
            Have suggestions for features you'd like to see? Let us know!
          </p>
          <div className="text-racing-green font-semibold">
            Keep racing, and stay tuned for updates!
          </div>
        </div>
      </div>
    </div>
  );
}