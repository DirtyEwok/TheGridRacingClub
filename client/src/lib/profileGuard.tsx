import { getCurrentMember } from "./memberSession";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Component that requires a user profile
export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const currentMember = getCurrentMember();

  useEffect(() => {
    if (!currentMember) {
      setLocation("/");
    }
  }, [currentMember, setLocation]);

  if (!currentMember) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}

// Hook to check if user has a profile
export function useRequireProfile() {
  const [, setLocation] = useLocation();
  const currentMember = getCurrentMember();

  useEffect(() => {
    if (!currentMember) {
      setLocation("/");
    }
  }, [currentMember, setLocation]);

  return currentMember;
}