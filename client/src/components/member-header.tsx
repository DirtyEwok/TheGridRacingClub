import { useState } from "react";
import { Link, useLocation, useRouter } from "wouter";
import { Menu, X, User, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import logoImage from "@assets/new-grid-logo.png";
import SignInModal from "./sign-in-modal";
import { getCurrentMember, clearCurrentMember } from "@/lib/memberSession";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { PushNotificationManager } from "./PushNotificationManager";

export default function MemberHeader() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const queryClient = useQueryClient();
  const currentMember = getCurrentMember();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { unreadRoomsCount, markRoomAsRead, markAllRoomsAsRead } = useChatNotifications();
  const router = useRouter();

  // Check if current member is admin (CJ DirtyEwok) or always show for owner
  const isAdmin = currentMember?.gamertag === "CJ DirtyEwok" || currentMember?.displayName === "CJ Carmichael";

  const navigation = [
    { name: "Chat", href: "/chat" },
    { name: "Championships", href: "/championships" },
    { name: "Races", href: "/races" },
    { name: "Leaderboards", href: "/leaderboards" },
    { name: "Coming Soon", href: "/coming-soon" },
    ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '/admin';
              }}
            >
              <img src={logoImage} alt="The Grid" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">The Grid</span>
            </div>
            
            {/* Notification Bell - separate from logo link */}
            {currentMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-3 relative text-gray-300 hover:text-racing-green p-2">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
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
                              {notification.message.message}
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors relative ${
                    location === item.href
                      ? "bg-racing-green text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => {
                    if (item.name === "Chat") {
                      // Mark chat as read when clicked
                      markAllRoomsAsRead();
                    }
                  }}
                >
                  {item.name}
                  {item.name === "Chat" && unreadRoomsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* Member Status & Mobile menu */}
          <div className="flex items-center space-x-2">
            {/* Member Status */}
            <div className="hidden md:flex items-center space-x-2">
              {currentMember ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">Welcome, {currentMember.displayName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Direct navigation attempt...');
                      window.location.href = `${window.location.origin}/members/${currentMember.id}/profile`;
                    }}
                    className="border-gray-600 text-white hover:bg-gray-700 h-6 px-2 text-xs"
                  >
                    <User className="w-3 h-3 mr-1" />
                    Profile
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/admin/members"}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white h-6 px-2 text-xs"
                      >
                        <User className="w-3 h-3 mr-1" />
                        Members
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/admin"}
                        className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white h-6 px-2 text-xs"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    </>
                  )}
                  <PushNotificationManager />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearCurrentMember();
                      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
                    }}
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 h-6 px-2 text-xs"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSignInOpen(true)}
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 h-6 px-2 text-xs"
                >
                  <User className="h-3 w-3 mr-1" />
                  Sign In
                </Button>
              )}
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
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (item.name === "Chat") {
                      markAllRoomsAsRead();
                    }
                  }}
                  className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors relative ${
                    location === item.href
                      ? "bg-racing-green text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.name}
                  {item.name === "Chat" && unreadRoomsCount > 0 && (
                    <span className="absolute top-2 right-3 h-3 w-3 bg-red-500 rounded-full"></span>
                  )}
                </div>
              </Link>
            ))}
            
            {/* Member-specific mobile navigation */}
            {currentMember && (
              <>
                <div className="border-t border-gray-600 my-2"></div>
                <div
                  onClick={() => {
                    const profileUrl = `/members/${currentMember.id}/profile`;
                    console.log('Mobile: Navigating to profile:', profileUrl);
                    router.push(profileUrl);
                    setIsMenuOpen(false);
                  }}
                  className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </div>
                
                {/* Mobile Alerts Section */}
                <div className="px-3 py-2">
                  <PushNotificationManager />
                </div>
                
                <div
                  onClick={() => {
                    clearCurrentMember();
                    queryClient.invalidateQueries({ queryKey: ["/api/races"] });
                    setIsMenuOpen(false);
                  }}
                  className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Sign Out
                </div>
              </>
            )}
            
            {/* Sign In for non-members */}
            {!currentMember && (
              <>
                <div className="border-t border-gray-600 my-2"></div>
                <div
                  onClick={() => {
                    setIsSignInOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="block px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
      />
    </header>
  );
}