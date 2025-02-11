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
  
// In ticketManagement.ts
export const processInviteLink = async (userId: string, startParam: string) => {
    console.log('Processing invite link:', {
      userId,
      startParam,
      timestamp: new Date().toISOString()
    });
  
    const db = getDatabase();
    
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      console.log('Extracted referrer ID:', referrerId);
      
      if (referrerId === userId) {
        console.log('Self-referral detected, ignoring');
        return;
      }
      
      const referrerRef = ref(db, `users/${referrerId}`);
      const userRef = ref(db, `users/${userId}`);
      
      try {
        // Log database references
        console.log('Database paths:', {
          referrerPath: referrerRef.toString(),
          userPath: userRef.toString()
        });
  
        // Get current data
        const [referrerSnapshot, userSnapshot] = await Promise.all([
          get(referrerRef),
          get(userRef)
        ]);
  
        // Log current data state
        console.log('Current database state:', {
          referrerExists: referrerSnapshot.exists(),
          referrerData: referrerSnapshot.val(),
          userExists: userSnapshot.exists(),
          userData: userSnapshot.val()
        });
  
        if (!referrerSnapshot.exists()) {
          console.error('Referrer not found in database');
          return;
        }
  
        const referrerData = referrerSnapshot.val();
        const userData = userSnapshot.val() || {};
  
        if (userData.invitedBy) {
          console.log('User already invited by:', userData.invitedBy);
          return;
        }
  
        // Prepare updates
        const updates = {
          [`users/${referrerId}/invites`]: {
            invitedFriends: [...(referrerData.invites?.invitedFriends || []), userId],
            timestamp: Date.now()
          },
          [`users/${referrerId}/permanentBonusTickets`]: (referrerData.permanentBonusTickets || 0) + 1,
          [`users/${userId}/invitedBy`]: referrerId,
          [`users/${userId}/permanentBonusTickets`]: 1,
          [`users/${userId}/invites`]: {
            invitedFriends: [],
            timestamp: Date.now()
          }
        };
  
        // Log updates before applying
        console.log('Preparing to update database with:', updates);
  
        // Apply updates
        await update(ref(db), updates);
  
        console.log('Successfully updated database');
      } catch (error) {
        console.error('Error processing invite:', error);
        // Log detailed error
        if (error instanceof Error) {
          console.error({
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
      }
    } else {
      console.log('Not a referral link, skipping');
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