import { Link, useLocation } from "wouter";
import { Flag } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/races", label: "Races" },
  ];

  return (
    <header className="bg-racing-black border-b-2 border-racing-green shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Flag className="text-2xl text-racing-green mr-3" />
            <h1 className="text-xl font-bold text-white">Xbox Racing Club</h1>
          </Link>
          <nav className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`font-medium transition-colors ${
                  location === item.path
                    ? "text-racing-green"
                    : "text-gray-300 hover:text-racing-green"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
