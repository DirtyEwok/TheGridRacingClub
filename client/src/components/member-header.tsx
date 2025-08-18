import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MemberHeader() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Races", href: "/races" },
    { name: "Championships", href: "/championships" },
  ];

  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/races">
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/admin';
                }}
              >
                <Trophy className="h-8 w-8 text-racing-green" />
                <span className="text-xl font-bold text-white">The Grid</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    location === item.href
                      ? "bg-racing-green text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>

          {/* Admin Access & Mobile menu */}
          <div className="flex items-center space-x-2">
            {/* Hidden admin access - double click on logo */}
            <div 
              onDoubleClick={() => window.location.href = '/admin'}
              className="cursor-pointer"
              title=""
            >
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors ${
                    location === item.href
                      ? "bg-racing-green text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}