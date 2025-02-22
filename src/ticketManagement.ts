// ticketManagement.ts
import { getDatabase, ref, get, set, update, runTransaction } from 'firebase/database';
import { VisitStats } from './userTracking';

interface InviteData {
    invitedBy?: string;
    invitedFriends: string[];
    timestamp: number;
}

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
  
interface ReferralData {
    invitedBy?: string;
    invitedUsers: string[];
    ticketsFromInvites: number;
  }
  
// In ticketManagement.ts
export const processInviteLink = async (userId: string, startParam: string) => {
    const db = getDatabase();
    console.log('Processing invite:', { userId, startParam });
    
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      console.log('Processing referral from:', referrerId, 'for user:', userId);
      
      // Don't allow self-referral
      if (referrerId === userId) {
        console.log('Self-referral detected, ignoring');
        return;
      }
      
      try {
        // Get current data
        const referrerRef = ref(db, `users/${referrerId}`);
        const userRef = ref(db, `users/${userId}`);
        
        const [referrerSnapshot, userSnapshot] = await Promise.all([
          get(referrerRef),
          get(userRef)
        ]);
  
        const userData = userSnapshot.val() || {};
        const referrerData = referrerSnapshot.val() || {};
  
        // Check if user has already been invited and received bonus
        if (userData.referrals?.hasReceivedInviteBonus) {
          console.log('User already received invite bonus');
          return;
        }
  
        // Prepare referrer updates
        const referrerUpdates = {
          [`users/${referrerId}/referrals/invitedUsers`]: [
            ...(referrerData.referrals?.invitedUsers || []),
            userId
          ],
          [`users/${referrerId}/referrals/ticketsFromInvites`]: 
            (referrerData.referrals?.ticketsFromInvites || 0) + 1
        };
  
        // Prepare new user updates
        const userUpdates = {
          [`users/${userId}/referrals/invitedBy`]: referrerId,
          [`users/${userId}/referrals/ticketsFromInvites`]: 1,
          [`users/${userId}/referrals/hasReceivedInviteBonus`]: true,
          [`users/${userId}/referrals/invitedUsers`]: [],
          [`users/${userId}/referrals/inviteTimestamp`]: Date.now()
        };
  
        // Apply all updates in one transaction
        await update(ref(db), {
          ...referrerUpdates,
          ...userUpdates
        });
  
        console.log('Successfully updated referral data for both users');
      } catch (error) {
        console.error('Error processing invite:', error);
        throw error;
      }
    }
  };

  export const calculateAvailableTickets = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        console.log(`No user found, returning default 5 tickets for ${userId}`);
        return 5;
      }
  
      const userData = snapshot.val();
      const referralData = userData.referrals || { ticketsFromInvites: 0 };
      
      // Base tickets every user gets
      const baseTickets = 5;
  
      // Streak bonus: current streak minus 1 (no bonus for first day)
      const streakBonus = Math.max(0, (userData.visits?.currentStreak || 1) - 1);
  
      // Bonus tickets from inviting other players
      const referralBonus = referralData.ticketsFromInvites || 0;
  
      // Calculate friends bonus (1 ticket per 2 friends)
      const friendsCount = userData.friends ? Object.keys(userData.friends).length : 0;
      const friendsBonus = Math.floor(friendsCount / 2);  // Integer division to get full tickets only
  
      // Total up all ticket sources
      const totalTickets = baseTickets + streakBonus + referralBonus + friendsBonus;
      
      console.log(`Ticket Breakdown for ${userId}:`, {
        baseTickets,
        streakBonus,
        referralBonus,
        friendsCount,
        friendsBonus,
        totalTickets
      });
  
      return totalTickets;
    } catch (error) {
      console.error(`Error calculating tickets for ${userId}:`, error);
      return 5; // Return base tickets on error
    }
  };
  
  // This function can be used to get how many friends are needed for next bonus ticket
  export const getNextFriendBonusInfo = (friendsCount: number): { 
    friendsForNextBonus: number,
    currentBonusTickets: number 
  } => {
    const currentBonusTickets = Math.floor(friendsCount / 2);
    const friendsForNextBonus = (currentBonusTickets + 1) * 2 - friendsCount;
    
    return {
      friendsForNextBonus,
      currentBonusTickets
    };
  };
  
  // This function updates play count after each game
  export const updatePlayCount = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    
    try {
      // Start a transaction to ensure atomic updates
      const result = await runTransaction(userRef, async (currentUserData) => {
        if (!currentUserData) {
          throw new Error('User not found');
        }
        const visits = currentUserData.visits || {};
        const maxTickets = await calculateAvailableTickets(userId);
        const currentPlays = visits.playsToday || 0;
        
        // HARD STOP: Prevent any plays beyond max tickets
        if (currentPlays >= maxTickets) {
          console.error(`TICKET LIMIT EXCEEDED: User ${userId} attempted to play beyond max tickets`);
          return { 
            ...currentUserData, 
            playAttemptBlocked: true 
          };
        }
  
        const newPlaysCount = currentPlays + 1;
        
        // Enforce strict ticket limit
        if (newPlaysCount > maxTickets) {
          console.error(`CRITICAL: Attempted to exceed max ticket limit for user ${userId}`);
          return currentUserData; // Reject the update
        }
  
        // Update play tracking with additional safeguards
        return {
          ...currentUserData,
          visits: {
            ...visits,
            playsToday: newPlaysCount,
            maxPlaysToday: maxTickets,
            playsRemaining: Math.max(0, maxTickets - newPlaysCount),
            lastPlayed: Date.now()
          }
        };
      });
  
      // Analyze transaction result
      if (result.committed) {
        const remainingPlays = result.snapshot.val()?.visits?.playsRemaining || 0;
        return remainingPlays;
      } else {
        console.error('Play count update transaction failed');
        return -1;
      }
    } catch (error) {
      console.error('CRITICAL ERROR in updatePlayCount:', error);
      return -1; // Prevent any plays on error
    }
  };