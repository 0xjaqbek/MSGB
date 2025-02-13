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
      console.log('Found referrer ID:', referrerId);
      
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
  
        // Check if this user has already been invited
        const existingInvites = referrerSnapshot.val()?.referrals?.invitedUsers || [];
        if (existingInvites.includes(userId)) {
          console.log('User already invited, ignoring');
          return;
        }
  
        // Update referrer data
        const referrerUpdates = {
          [`users/${referrerId}/referrals/invitedUsers`]: [
            ...(referrerSnapshot.val()?.referrals?.invitedUsers || []),
            userId
          ],
          [`users/${referrerId}/referrals/totalInvites`]: 
            (referrerSnapshot.val()?.referrals?.totalInvites || 0) + 1,
          [`users/${referrerId}/referrals/ticketsFromInvites`]: 
            (referrerSnapshot.val()?.referrals?.ticketsFromInvites || 0) + 1
        };
        
        // Update new user data
        const userUpdates = {
          [`users/${userId}/referrals/invitedBy`]: referrerId,
          [`users/${userId}/referrals/inviteTimestamp`]: Date.now(),
          [`users/${userId}/referrals/ticketsFromInvites`]: 
            (userSnapshot.val()?.referrals?.ticketsFromInvites || 0) + 1
        };
  
        // Apply all updates
        await update(ref(db), {
          ...referrerUpdates,
          ...userUpdates
        });
  
        console.log('Successfully updated referral data');
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