// ticketManagement.ts
import { getDatabase, ref, get, set } from 'firebase/database';
import { VisitStats } from './userTracking';

export const getCurrentPlayCount = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const userRef = ref(db, `users/${userId}/visits`);
  const snapshot = await get(userRef);
  
  if (!snapshot.exists()) {
    return 0;
  }
  
  const userData = snapshot.val() as VisitStats;
  return userData.playsToday || 0;
};

export const calculateAvailableTickets = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const userRef = ref(db, `users/${userId}`);
  const visitsRef = ref(db, `users/${userId}/visits`);
  
  const [userSnapshot, visitsSnapshot] = await Promise.all([
    get(userRef),
    get(visitsRef)
  ]);
  
  if (!visitsSnapshot.exists()) {
    return 3; // Base tickets
  }
  
  const visitsData = visitsSnapshot.val() as VisitStats;
  const userData = userSnapshot.val();
  
  // Base tickets from streak (your existing system)
  let baseTickets = 5 + (visitsData.currentStreak - 1);
  
  // Add permanent bonus from invited friends
  if (userData && userData.invitedFriends) {
    baseTickets += userData.invitedFriends;
  }
  
  // Check active friends (played in last 3 days)
  let activeFriendBonus = 0;
  if (userData && userData.friends) {
    const now = Date.now();
    const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
    
    Object.values(userData.friends).forEach((friend: any) => {
      if (friend.lastPlayed && friend.lastPlayed > threeDaysAgo) {
        activeFriendBonus += 0.5;
      }
    });
  }
  
  // Round up the total tickets
  return Math.ceil(baseTickets + activeFriendBonus);
};

export const updatePlayCount = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const userVisitsRef = ref(db, `users/${userId}/visits`);
  
  try {
    const snapshot = await get(userVisitsRef);
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }
    
    const userData = snapshot.val() as VisitStats;
    const newPlaysCount = (userData.playsToday || 0) + 1;
    const availableTickets = await calculateAvailableTickets(userId);
    
    if (newPlaysCount > availableTickets) {
      return -1; // No plays remaining
    }
    
    // Preserve all existing data while updating play count
    await set(userVisitsRef, {
      ...userData,
      playsToday: newPlaysCount,
      maxPlaysToday: availableTickets,
      playsRemaining: availableTickets - newPlaysCount,
      lastPlayed: Date.now()
    });
    
    return availableTickets - newPlaysCount;
  } catch (error) {
    console.error('Error updating play count:', error);
    throw error;
  }
};