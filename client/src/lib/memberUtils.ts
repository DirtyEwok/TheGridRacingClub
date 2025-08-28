// Utility function to get the appropriate styling for member gamertags
export const getMemberGametagStyling = (gamertag: string) => {
  if (['CJ DirtyEwok', 'Adzinski82'].includes(gamertag)) {
    return 'text-lime-400'; // Green
  }
  if (['Alexcdl18', 'Stalker Brown', 'Snuffles 1983', 'Neilb2112'].includes(gamertag)) {
    return 'text-yellow-400'; // Yellow
  }
  return 'text-gray-300'; // Default
};

// Get background style for special members (used in chat)
export const getMemberGametagBackground = (gamertag: string) => {
  if (['CJ DirtyEwok', 'Adzinski82', 'Alexcdl18', 'Stalker Brown', 'Snuffles 1983', 'Neilb2112'].includes(gamertag)) {
    return {}; // No background for special members
  }
  return {}; // Default no background
};