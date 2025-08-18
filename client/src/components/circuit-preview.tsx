import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Zap, Trophy } from "lucide-react";

interface TrackHighlight {
  name: string;
  type: "corner" | "straight" | "sector";
  position: { x: number; y: number };
  description: string;
}

interface CircuitData {
  name: string;
  layout: string;
  highlights: TrackHighlight[];
  stats: {
    length: string;
    turns: number;
    lapRecord: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  };
}

const trackDatabase: Record<string, CircuitData> = {
  "Red Bull Ring": {
    name: "Red Bull Ring",
    layout: "M 50 200 Q 100 50 200 100 Q 300 50 350 150 Q 400 200 350 250 Q 300 300 200 280 Q 100 350 50 200 Z",
    highlights: [
      { name: "Turn 1", type: "corner", position: { x: 120, y: 80 }, description: "Sharp right-hander after main straight" },
      { name: "Turn 3", type: "corner", position: { x: 280, y: 120 }, description: "Uphill left turn with elevation change" },
      { name: "Main Straight", type: "straight", position: { x: 200, y: 180 }, description: "DRS zone with overtaking opportunities" }
    ],
    stats: { length: "4.318 km", turns: 10, lapRecord: "1:05.619", difficulty: "Intermediate" }
  },
  "Zolder": {
    name: "Zolder",
    layout: "M 100 150 Q 80 100 120 80 Q 180 60 220 90 Q 280 120 300 180 Q 290 240 250 260 Q 200 280 150 250 Q 100 220 100 150 Z",
    highlights: [
      { name: "Chicane", type: "corner", position: { x: 140, y: 90 }, description: "Technical chicane requiring precision" },
      { name: "Sector 2", type: "sector", position: { x: 250, y: 150 }, description: "Fast flowing section through forest" },
      { name: "Final Corner", type: "corner", position: { x: 120, y: 200 }, description: "Tight hairpin before main straight" }
    ],
    stats: { length: "4.011 km", turns: 14, lapRecord: "1:25.305", difficulty: "Advanced" }
  },
  "Monza": {
    name: "Monza",
    layout: "M 80 180 L 320 180 Q 350 180 350 150 L 350 100 Q 350 70 320 70 L 250 70 Q 220 70 220 100 L 220 130 Q 220 160 250 160 L 180 160 Q 150 160 150 130 L 150 100 Q 150 70 120 70 L 80 70 Q 50 70 50 100 L 50 150 Q 50 180 80 180 Z",
    highlights: [
      { name: "Parabolica", type: "corner", position: { x: 300, y: 120 }, description: "Famous high-speed sweeping corner" },
      { name: "Main Straight", type: "straight", position: { x: 200, y: 180 }, description: "Longest straight in F1 calendar" },
      { name: "Chicane", type: "corner", position: { x: 180, y: 100 }, description: "First chicane heavy braking zone" }
    ],
    stats: { length: "5.793 km", turns: 11, lapRecord: "1:21.046", difficulty: "Intermediate" }
  },
  "Laguna Seca": {
    name: "Laguna Seca",
    layout: "M 100 250 Q 50 200 80 150 Q 120 100 180 120 Q 240 140 280 100 Q 320 60 350 120 Q 380 180 340 220 Q 300 260 250 240 Q 200 220 160 240 Q 120 260 100 250 Z",
    highlights: [
      { name: "Corkscrew", type: "corner", position: { x: 320, y: 90 }, description: "Famous downhill corkscrew turn combination" },
      { name: "Turn 2", type: "corner", position: { x: 150, y: 130 }, description: "Uphill left-hander with blind apex" },
      { name: "Andretti Hairpin", type: "corner", position: { x: 180, y: 240 }, description: "Tight hairpin with overtaking potential" }
    ],
    stats: { length: "3.602 km", turns: 11, lapRecord: "1:11.786", difficulty: "Expert" }
  },
  "Hungaroring": {
    name: "Hungaroring",
    layout: "M 120 200 Q 80 150 120 100 Q 180 60 240 100 Q 300 140 320 200 Q 300 260 240 280 Q 180 300 120 260 Q 80 220 120 200 Z",
    highlights: [
      { name: "Turn 1", type: "corner", position: { x: 150, y: 120 }, description: "Downhill right-hander into chicane" },
      { name: "Turn 4", type: "corner", position: { x: 280, y: 180 }, description: "Long right-hand corner with multiple lines" },
      { name: "Final Sector", type: "sector", position: { x: 160, y: 260 }, description: "Twisty section leading to main straight" }
    ],
    stats: { length: "4.381 km", turns: 14, lapRecord: "1:16.627", difficulty: "Advanced" }
  },
  "Paul Ricard": {
    name: "Paul Ricard",
    layout: "M 60 220 L 180 220 Q 220 220 240 200 L 260 160 Q 280 140 320 160 L 340 180 Q 360 200 340 240 L 320 280 Q 280 300 240 280 L 200 260 Q 160 240 140 200 L 120 160 Q 100 140 80 160 L 60 180 Q 40 200 60 220 Z",
    highlights: [
      { name: "Mistral Straight", type: "straight", position: { x: 120, y: 220 }, description: "Long straight with chicane opportunities" },
      { name: "Signes Corner", type: "corner", position: { x: 320, y: 200 }, description: "High-speed sweeping right-hander" },
      { name: "Chicane du Pont", type: "corner", position: { x: 200, y: 160 }, description: "Technical chicane breaking up straight" }
    ],
    stats: { length: "5.842 km", turns: 15, lapRecord: "1:32.740", difficulty: "Intermediate" }
  },
  "Watkins Glen": {
    name: "Watkins Glen",
    layout: "M 80 180 Q 120 120 200 140 Q 280 160 320 220 Q 340 280 280 300 Q 220 320 160 280 Q 100 240 80 180 Z",
    highlights: [
      { name: "The Esses", type: "corner", position: { x: 180, y: 150 }, description: "Challenging S-curve section uphill" },
      { name: "Turn 1", type: "corner", position: { x: 110, y: 200 }, description: "90-degree right turn after main straight" },
      { name: "The Boot", type: "sector", position: { x: 280, y: 260 }, description: "Technical infield section" }
    ],
    stats: { length: "5.472 km", turns: 11, lapRecord: "1:18.441", difficulty: "Advanced" }
  },

  "Zandvoort": {
    name: "Zandvoort",
    layout: "M 100 180 Q 140 120 200 140 Q 260 160 300 200 Q 320 240 280 280 Q 240 320 180 300 Q 120 280 100 240 Q 80 200 100 180 Z",
    highlights: [
      { name: "Tarzanbocht", type: "corner", position: { x: 160, y: 150 }, description: "Famous first corner hairpin" },
      { name: "Banked Turn 3", type: "corner", position: { x: 280, y: 180 }, description: "Banked high-speed corner" },
      { name: "Scheivlak", type: "corner", position: { x: 200, y: 280 }, description: "Fast chicane complex" }
    ],
    stats: { length: "4.259 km", turns: 14, lapRecord: "1:11.097", difficulty: "Expert" }
  },
  "Spa-Francorchamps": {
    name: "Spa-Francorchamps",
    layout: "M 80 200 Q 60 150 100 100 Q 150 60 220 80 Q 300 100 350 150 Q 380 200 350 250 Q 300 300 220 280 Q 150 260 100 220 Q 60 180 80 200 Z",
    highlights: [
      { name: "Eau Rouge", type: "corner", position: { x: 120, y: 120 }, description: "Legendary uphill left-right combination" },
      { name: "Kemmel Straight", type: "straight", position: { x: 250, y: 90 }, description: "Long straight with DRS overtaking zone" },
      { name: "Bus Stop Chicane", type: "corner", position: { x: 200, y: 260 }, description: "Tight chicane before main straight" }
    ],
    stats: { length: "7.004 km", turns: 20, lapRecord: "1:41.252", difficulty: "Expert" }
  },
  "Silverstone": {
    name: "Silverstone",
    layout: "M 100 180 Q 80 120 140 90 Q 200 60 280 90 Q 350 120 380 180 Q 350 240 280 270 Q 200 300 140 270 Q 80 240 100 180 Z",
    highlights: [
      { name: "Copse Corner", type: "corner", position: { x: 150, y: 100 }, description: "High-speed right-hander opening sequence" },
      { name: "Maggotts-Becketts", type: "sector", position: { x: 280, y: 120 }, description: "Fast flowing S-curves complex" },
      { name: "Stowe Corner", type: "corner", position: { x: 200, y: 280 }, description: "Slow hairpin with overtaking opportunities" }
    ],
    stats: { length: "5.891 km", turns: 18, lapRecord: "1:24.303", difficulty: "Advanced" }
  },
  "Mount Panorama": {
    name: "Mount Panorama",
    layout: "M 80 250 Q 70 200 110 160 Q 150 120 210 110 Q 270 100 330 130 Q 380 160 390 220 Q 400 280 350 320 Q 300 360 240 350 Q 180 340 130 300 Q 80 260 80 250 Z",
    highlights: [
      { name: "The Cutting", type: "corner", position: { x: 140, y: 140 }, description: "Steep uphill climb through the cutting" },
      { name: "Skyline", type: "corner", position: { x: 320, y: 150 }, description: "Dramatic mountaintop section with views" },
      { name: "The Chase", type: "sector", position: { x: 250, y: 320 }, description: "Fast downhill section back to start/finish" }
    ],
    stats: { length: "6.213 km", turns: 23, lapRecord: "2:01.286", difficulty: "Expert" }
  },
  "Kyalami": {
    name: "Kyalami",
    layout: "M 120 200 Q 100 150 150 120 Q 200 90 260 110 Q 320 130 350 180 Q 370 230 340 270 Q 310 310 250 300 Q 190 290 150 250 Q 110 210 120 200 Z",
    highlights: [
      { name: "Turn 1", type: "corner", position: { x: 160, y: 130 }, description: "High-speed right-hander after main straight" },
      { name: "Crowthorne Corner", type: "corner", position: { x: 320, y: 200 }, description: "Fast sweeping corner with elevation change" },
      { name: "Sunset Bend", type: "corner", position: { x: 200, y: 280 }, description: "Technical corner leading onto back straight" }
    ],
    stats: { length: "4.522 km", turns: 16, lapRecord: "1:16.976", difficulty: "Advanced" }
  },
  // Track name aliases for different naming formats
  "Circuit of Spa-Francorchamps": {
    name: "Circuit of Spa-Francorchamps",
    layout: "M 80 200 Q 60 150 100 100 Q 150 60 220 80 Q 300 100 350 150 Q 380 200 350 250 Q 300 300 220 280 Q 150 260 100 220 Q 60 180 80 200 Z",
    highlights: [
      { name: "Eau Rouge", type: "corner", position: { x: 120, y: 120 }, description: "Legendary uphill left-right combination" },
      { name: "Kemmel Straight", type: "straight", position: { x: 250, y: 90 }, description: "Long straight with DRS overtaking zone" },
      { name: "Bus Stop Chicane", type: "corner", position: { x: 200, y: 260 }, description: "Tight chicane before main straight" }
    ],
    stats: { length: "7.004 km", turns: 20, lapRecord: "1:41.252", difficulty: "Expert" }
  },
  "Silverstone Circuit - GP Layout": {
    name: "Silverstone Circuit - GP Layout",
    layout: "M 100 180 Q 80 120 140 90 Q 200 60 280 90 Q 350 120 380 180 Q 350 240 280 270 Q 200 300 140 270 Q 80 240 100 180 Z",
    highlights: [
      { name: "Copse Corner", type: "corner", position: { x: 150, y: 100 }, description: "High-speed right-hander opening sequence" },
      { name: "Maggotts-Becketts", type: "sector", position: { x: 280, y: 120 }, description: "Fast flowing S-curves complex" },
      { name: "Stowe Corner", type: "corner", position: { x: 200, y: 280 }, description: "Slow hairpin with overtaking opportunities" }
    ],
    stats: { length: "5.891 km", turns: 18, lapRecord: "1:24.303", difficulty: "Advanced" }
  },

};

interface CircuitPreviewProps {
  trackName: string;
  carClass: string;
  isVisible?: boolean;
}

export default function CircuitPreview({ trackName, carClass, isVisible = true }: CircuitPreviewProps) {
  const [currentHighlight, setCurrentHighlight] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  const circuit = trackDatabase[trackName];
  
  useEffect(() => {
    if (!circuit || !isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % circuit.highlights.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [circuit, isVisible]);

  if (!circuit) {
    return (
      <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Track preview unavailable</p>
          <p className="text-xs text-gray-500">{trackName}</p>
        </div>
      </div>
    );
  }

  const currentHighlightData = circuit.highlights[currentHighlight];

  return (
    <div className="w-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">{circuit.name}</h3>
            <p className="text-sm text-gray-400">{carClass} Circuit</p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Trophy className="w-4 h-4 text-green-400" />
          </button>
        </div>
      </div>

      {/* Circuit Animation */}
      <div className="relative h-64 bg-gray-800">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(34, 197, 94, 0.1) 0%, transparent 70%)" }}
        >
          {/* Track Layout */}
          <motion.path
            d={circuit.layout}
            stroke="rgb(34, 197, 94)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          
          {/* Racing Line Animation */}
          <motion.path
            d={circuit.layout}
            stroke="rgb(251, 191, 36)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="10 5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />

          {/* Track Highlights */}
          {circuit.highlights.map((highlight, index) => (
            <motion.g key={index}>
              <motion.circle
                cx={highlight.position.x}
                cy={highlight.position.y}
                r={index === currentHighlight ? "12" : "8"}
                fill={index === currentHighlight ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: index === currentHighlight ? [1, 1.2, 1] : 1,
                  opacity: index === currentHighlight ? 1 : 0.6
                }}
                transition={{ 
                  duration: index === currentHighlight ? 0.6 : 0.3,
                  repeat: index === currentHighlight ? Infinity : 0,
                  repeatType: "reverse"
                }}
              />
              
              {/* Highlight Icon */}
              <motion.circle
                cx={highlight.position.x}
                cy={highlight.position.y}
                r="4"
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ opacity: index === currentHighlight ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
              />
            </motion.g>
          ))}

          {/* Car Animation */}
          <motion.circle
            r="6"
            fill="rgb(239, 68, 68)"
            stroke="white"
            strokeWidth="2"
          >
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={circuit.layout}
            />
          </motion.circle>
        </svg>

        {/* Current Highlight Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHighlight}
            className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-2 mb-1">
              {currentHighlightData.type === "corner" && <Zap className="w-4 h-4 text-red-400" />}
              {currentHighlightData.type === "straight" && <MapPin className="w-4 h-4 text-yellow-400" />}
              {currentHighlightData.type === "sector" && <Trophy className="w-4 h-4 text-green-400" />}
              <span className="text-sm font-medium text-white">{currentHighlightData.name}</span>
            </div>
            <p className="text-xs text-gray-300">{currentHighlightData.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            className="border-t border-gray-700 p-4 bg-gray-800"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-3 h-3 text-green-400" />
                  <span className="text-gray-400">Length</span>
                </div>
                <span className="text-white font-mono">{circuit.stats.length}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-gray-400">Turns</span>
                </div>
                <span className="text-white font-mono">{circuit.stats.turns}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-gray-400">Lap Record</span>
                </div>
                <span className="text-white font-mono">{circuit.stats.lapRecord}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-400">Difficulty</span>
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  circuit.stats.difficulty === "Beginner" ? "bg-green-900 text-green-200" :
                  circuit.stats.difficulty === "Intermediate" ? "bg-yellow-900 text-yellow-200" :
                  circuit.stats.difficulty === "Advanced" ? "bg-orange-900 text-orange-200" :
                  "bg-red-900 text-red-200"
                }`}>
                  {circuit.stats.difficulty}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}