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
      
      // Base tickets (5) + streak bonus (max 69) + referral bonus
      const baseTickets = 5;
      const currentStreak = userData.visits?.currentStreak || 1;
      // Progressive streak bonus: +1 on day 2, +2 on day 3, etc., capped at 69
      const streakBonus = currentStreak > 1 ? Math.min(69, currentStreak - 1) : 0;
      const referralBonus = referralData.ticketsFromInvites || 0;
      
      return baseTickets + streakBonus + referralBonus;
    } catch (error) {
      console.error('Error calculating tickets:', error);
      return 5;
    }
  };
  
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
  
        console.log('Current data:', {
          referrerData: referrerSnapshot.val(),
          userData: userSnapshot.val()
        });
  
        // First check if user has already been invited
        const userData = userSnapshot.val() || {};
        if (userData.referrals?.invitedBy) {
          console.log('User already invited by:', userData.referrals.invitedBy);
          return;
        }
  
        // Prepare referrer updates
        const referrerData = referrerSnapshot.val() || {};
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