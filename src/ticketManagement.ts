// ticketManagement.ts
import { getDatabase, ref, get, set, update } from 'firebase/database';
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
  
  export const processInviteLink = async (userId: string, startParam: string) => {
    const db = getDatabase();
    
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      
      // Don't allow self-referral
      if (referrerId === userId) {
        return;
      }
      
      const referrerRef = ref(db, `users/${referrerId}/referrals`);
      const userRef = ref(db, `users/${userId}/referrals`);
      
      try {
        // Get current referral data for both users
        const [referrerSnapshot, userSnapshot] = await Promise.all([
          get(referrerRef),
          get(userRef)
        ]);
  
        const referrerData: ReferralData = referrerSnapshot.exists() ? 
          referrerSnapshot.val() : 
          { invitedUsers: [], ticketsFromInvites: 0 };
  
        const userData: ReferralData = userSnapshot.exists() ? 
          userSnapshot.val() : 
          { invitedUsers: [], ticketsFromInvites: 0 };
  
        // If user hasn't been invited before
        if (!userData.invitedBy) {
          // Update referrer's data - they get a ticket for inviting
          if (!referrerData.invitedUsers.includes(userId)) {
            referrerData.invitedUsers.push(userId);
            referrerData.ticketsFromInvites = (referrerData.ticketsFromInvites || 0) + 1;
  
            await set(referrerRef, referrerData);
          }
  
          // Update new user's data - they get a ticket for being invited
          userData.invitedBy = referrerId;
          userData.ticketsFromInvites = 1;
  
          await set(userRef, userData);
  
          // Also update visits data to reflect new ticket count
          const visitsRef = ref(db, `users/${userId}/visits`);
          const visitsSnapshot = await get(visitsRef);
          
          if (visitsSnapshot.exists()) {
            const visitsData = visitsSnapshot.val();
            const maxPlays = visitsData.maxPlaysToday + 1; // Add one for the invite bonus
            
            await update(visitsRef, {
              maxPlaysToday: maxPlays,
              playsRemaining: maxPlays - (visitsData.playsToday || 0)
            });
          }
        }
      } catch (error) {
        console.error('Error processing invite:', error);
      }
    }
  };

export const calculateAvailableTickets = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        return 5; // Base tickets
      }
  
      const userData = snapshot.val();
      const referralData = userData.referrals || { ticketsFromInvites: 0 };
      
      // Base tickets (5) + streak bonus + referral bonus
      const baseTickets = 5;
      const streakBonus = Math.max(0, (userData.visits?.currentStreak || 1) - 1);
      const referralBonus = referralData.ticketsFromInvites || 0;
      
      return baseTickets + streakBonus + referralBonus;
    } catch (error) {
      console.error('Error calculating tickets:', error);
      return 5;
    }
};
  
  export const updatePlayCount = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }
      
      const userData = snapshot.val();
      const visits = userData.visits || {};
      const maxTickets = await calculateAvailableTickets(userId);
      const currentPlays = visits.playsToday || 0;
      const newPlaysCount = currentPlays + 1;
      
      console.log('Play count update:', {
        userId,
        currentPlays,
        newPlaysCount,
        maxTickets,
        permanentBonus: userData.permanentBonusTickets
      });
      
      if (newPlaysCount > maxTickets) {
        return -1; // No plays remaining
      }
      
      // Update the plays count
      await update(userRef, {
        'visits/playsToday': newPlaysCount,
        'visits/maxPlaysToday': maxTickets,
        'visits/playsRemaining': maxTickets - newPlaysCount,
        'visits/lastPlayed': Date.now()
      });
      
      return maxTickets - newPlaysCount;
    } catch (error) {
      console.error('Error updating play count:', error);
      throw error;
    }
  };