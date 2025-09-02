import { Link, useLocation } from "wouter";
import { Bell } from "lucide-react";
import logoImage from "@assets/new-grid-logo.png";
import { useNotifications } from "@/hooks/useNotifications";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getCurrentMember } from "@/lib/memberSession";

export default function Header() {
  const [location] = useLocation();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { unreadRoomsCount, markAllRoomsAsRead } = useChatNotifications();
  const currentMember = getCurrentMember();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/races", label: "Races" },
    { path: "/championships", label: "Championships" },
    { path: "/leaderboards", label: "Leaderboards" },
    { path: "/chat", label: "Chat" },
    { path: "/coming-soon", label: "Coming Soon" },
    { path: "/admin", label: "Admin" },
  ];

  return (
    <header className="bg-racing-black border-b-2 border-racing-green shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="The Grid" className="h-14 w-auto mr-3" />
              <h1 className="text-xl font-bold text-white">The Grid Racing Club</h1>
            </Link>
            
            {/* Notification Bell next to title */}
            <div className="ml-4 p-2 text-white bg-red-500 rounded">
              🔔 BELL TEST
            </div>
          </div>
          
          <nav className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`font-medium transition-colors relative ${
                  location === item.path
                    ? "text-racing-green"
                    : "text-gray-300 hover:text-racing-green"
                }`}
                onClick={() => {
                  if (item.label === "Chat") {
                    markAllRoomsAsRead();
                  }
                }}
              >
                {item.label}
                {item.label === "Chat" && unreadRoomsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
