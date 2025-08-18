import type { Member } from "@shared/schema";

const MEMBER_STORAGE_KEY = "grid-racing-member";

export function getCurrentMember(): Member | null {
  try {
    const memberData = localStorage.getItem(MEMBER_STORAGE_KEY);
    return memberData ? JSON.parse(memberData) : null;
  } catch {
    return null;
  }
}

export function setCurrentMember(member: Member): void {
  localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
}

export function clearCurrentMember(): void {
  localStorage.removeItem(MEMBER_STORAGE_KEY);
}

export function getCurrentMemberId(): string | null {
  const member = getCurrentMember();
  return member?.id || null;
}