import { Link, useLocation } from "wouter";
import { Bell } from "lucide-react";
import logoImage from "@assets/new-grid-logo.png";
import { useNotifications } from "@/hooks/useNotifications";
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
            {currentMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative text-gray-300 hover:text-racing-green p-2 ml-4"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-80 max-h-96 overflow-y-auto bg-gray-900 border-gray-700"
                >
                  <div className="px-3 py-2 text-sm font-semibold text-white border-b border-gray-700">
                    Mentions ({unreadCount})
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-400 text-center">
                      No new mentions
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 5).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="px-3 py-3 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                          onClick={() => {
                            markAsRead(notification.id);
                            // Navigate to chat room
                            window.location.href = `/chat?room=${notification.chatRoom.id}`;
                          }}
                        >
                          <div className="w-full">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-orange-400 font-medium">
                                {notification.message.member.gamertag}
                              </span>
                              <span className="text-xs text-gray-400">
                                mentioned you in {notification.chatRoom.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-300 truncate">
                              {notification.message.message.replace(/@\w+/g, (match) => 
                                match.toLowerCase().includes(currentMember.gamertag.toLowerCase()) 
                                  ? `@${currentMember.gamertag}` 
                                  : match
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      
                      {notifications.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="bg-gray-700" />
                          <DropdownMenuItem
                            className="px-3 py-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-center"
                            onClick={markAllAsRead}
                          >
                            <span className="text-sm text-racing-green">Mark all as read</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
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
