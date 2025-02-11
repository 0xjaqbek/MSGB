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
      console.log('Processing referral from:', referrerId, 'for user:', userId);
      
      if (referrerId === userId) {
        console.log('Self-referral detected, ignoring');
        return;
      }
      
      try {
        // Get current data for both users
        const referrerSnapshot = await get(ref(db, `users/${referrerId}`));
        const userSnapshot = await get(ref(db, `users/${userId}`));
  
        // First, let's update the new user's data with referral info
        const updates: any = {
          [`users/${userId}/referralInfo`]: {
            invitedBy: referrerId,
            inviteTimestamp: Date.now()
          }
        };
  
        // Then update the referrer's data - add this user to their invited list
        const referrerData = referrerSnapshot.val() || {};
        if (!referrerData.referralInfo) {
          referrerData.referralInfo = {
            invitedUsers: [],
            totalInvites: 0
          };
        }
  
        // Add the new user to referrer's invited list if not already there
        if (!referrerData.referralInfo.invitedUsers.includes(userId)) {
          updates[`users/${referrerId}/referralInfo`] = {
            ...referrerData.referralInfo,
            invitedUsers: [...(referrerData.referralInfo.invitedUsers || []), userId],
            totalInvites: (referrerData.referralInfo.totalInvites || 0) + 1
          };
        }
  
        // Set the initial maxPlaysToday to include invite bonus
        if (!userSnapshot.exists()) {
          updates[`users/${userId}/visits/maxPlaysToday`] = 6; // Base 5 + 1 from invite
          updates[`users/${userId}/visits/playsRemaining`] = 6;
        }
  
        console.log('Applying updates:', updates);
        await update(ref(db), updates);
        console.log('Successfully processed invite link');
  
      } catch (error) {
        console.error('Error processing invite:', error);
        throw error;
      }
    } else {
      console.log('Not a referral link');
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