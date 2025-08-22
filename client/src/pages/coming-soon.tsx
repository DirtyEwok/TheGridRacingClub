import comingSoonImage from "@assets/EVENTS-18_1755875515221.png";

export default function ComingSoon() {

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            <span className="text-racing-green">Coming Soon</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Here's what's coming to The Grid Racing Club.
          </p>
          
          {/* Masterclass Season 9 Image */}
          <div className="flex justify-center mb-8">
            <img 
              src={comingSoonImage} 
              alt="Masterclass Season 9 - Coming Soon" 
              className="max-w-lg w-full h-auto rounded-lg shadow-lg border-2 border-racing-green"
            />
          </div>
          
          {/* Season 9 Details */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-lg text-gray-300 leading-relaxed">
              We return with Season 9 of the Grid's MasterClass and this time its GT2 power.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mt-2">
              Full details will be announced soon.
            </p>
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