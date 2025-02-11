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

// Add to ticketManagement.ts

interface InviteData {
    invitedBy?: string;
    invitedFriends: string[];
    timestamp: number;
  }
  
  export const processInviteLink = async (userId: string, startParam: string) => {
    const db = getDatabase();
    
    // If this is a referral
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      
      // Don't allow self-referral
      if (referrerId === userId) return;
      
      const referrerRef = ref(db, `users/${referrerId}/invites`);
      const userRef = ref(db, `users/${userId}/invites`);
      
      // Get current invite data
      const [referrerData, userData] = await Promise.all([
        get(referrerRef),
        get(userRef)
      ]);
      
      // If user hasn't been invited before
      if (!userData.exists() || !userData.val().invitedBy) {
        // Update referrer's invited friends list
        const referrerInvites: InviteData = referrerData.exists() 
          ? referrerData.val() 
          : { invitedFriends: [], timestamp: Date.now() };
        
        if (!referrerInvites.invitedFriends.includes(userId)) {
          referrerInvites.invitedFriends.push(userId);
          await set(referrerRef, referrerInvites);
        }
        
        // Mark user as invited
        await set(userRef, {
          invitedBy: referrerId,
          invitedFriends: [],
          timestamp: Date.now()
        });
      }
    }
  };
  
  // Update calculateAvailableTickets in ticketManagement.ts
  export const calculateAvailableTickets = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    const visitsRef = ref(db, `users/${userId}/visits`);
    const invitesRef = ref(db, `users/${userId}/invites`);
    
    const [userSnapshot, visitsSnapshot, invitesSnapshot] = await Promise.all([
      get(userRef),
      get(visitsRef),
      get(invitesRef)
    ]);
    
    if (!visitsSnapshot.exists()) {
      return 5; // Base tickets
    }
    
    const visitsData = visitsSnapshot.val() as VisitStats;
    const invitesData = invitesSnapshot.exists() ? invitesSnapshot.val() as InviteData : null;
    
    // Base tickets from streak
    let baseTickets = 5;
    
    // Add streak bonus
    baseTickets += (visitsData.currentStreak - 1);
    
    // Add permanent bonus from invited friends
    if (invitesData?.invitedFriends) {
      baseTickets += invitesData.invitedFriends.length;
    }
    
    return Math.ceil(baseTickets);
  };