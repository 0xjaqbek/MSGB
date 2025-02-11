// ticketManagement.ts
import { getDatabase, ref, get, set, update } from 'firebase/database';
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
    
    // Check if this is a referral link
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      
      // Don't allow self-referral
      if (referrerId === userId) return;
      
      const referrerRef = ref(db, `users/${referrerId}`);
      const userRef = ref(db, `users/${userId}`);
      
      try {
        // Get current data for both users
        const [referrerSnapshot, userSnapshot] = await Promise.all([
          get(referrerRef),
          get(userRef)
        ]);
  
        const referrerData = referrerSnapshot.val() || {};
        const userData = userSnapshot.val() || {};
  
        // Check if user has already been invited
        if (userData.invitedBy) {
          return;
        }
  
        // Initialize invite data if it doesn't exist
        if (!referrerData.invites) {
          referrerData.invites = {
            invitedFriends: [],
            timestamp: Date.now()
          };
        }
  
        // Add user to referrer's invited friends list
        if (!referrerData.invites.invitedFriends.includes(userId)) {
          referrerData.invites.invitedFriends.push(userId);
          
          // Update referrer data
          await update(referrerRef, {
            invites: referrerData.invites,
            permanentBonusTickets: (referrerData.permanentBonusTickets || 0) + 1
          });
  
          // Mark new user as invited and give them a bonus ticket
          await update(userRef, {
            invitedBy: referrerId,
            permanentBonusTickets: 1,
            invites: {
              invitedFriends: [],
              timestamp: Date.now()
            }
          });
        }
      } catch (error) {
        console.error('Error processing invite:', error);
      }
    }
  };
  
  // Update calculateAvailableTickets in ticketManagement.ts
  export const calculateAvailableTickets = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        return 5; // Base tickets for new users
      }
  
      const userData = snapshot.val();
      
      // Calculate total tickets:
      // 5 (base) + streak bonus + permanent bonus from invites
      const baseTickets = 5;
      const streakBonus = (userData.visits?.currentStreak || 1) - 1;
      const permanentBonus = userData.permanentBonusTickets || 0;
      
      return baseTickets + streakBonus + permanentBonus;
    } catch (error) {
      console.error('Error calculating tickets:', error);
      return 5; // Return base tickets on error
    }
  };