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
    console.log('Starting invite processing:', { userId, startParam });
    
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      console.log('Processing referral:', { referrerId, userId });
      
      if (referrerId === userId) {
        console.log('Self-referral detected, skipping');
        return;
      }
      
      try {
        // First update the new user's data directly
        console.log('Setting invited user data...');
        await set(ref(db, `users/${userId}/referralInfo`), {
          invitedBy: referrerId,
          inviteTimestamp: Date.now()
        });
  
        // Then update the referrer's data
        console.log('Updating referrer data...');
        const referrerRef = ref(db, `users/${referrerId}/referralInfo`);
        const referrerSnapshot = await get(referrerRef);
        const referrerData = referrerSnapshot.val() || { invitedUsers: [], totalInvites: 0 };
  
        if (!referrerData.invitedUsers.includes(userId)) {
          await set(referrerRef, {
            ...referrerData,
            invitedUsers: [...referrerData.invitedUsers, userId],
            totalInvites: referrerData.totalInvites + 1
          });
        }
  
        // Set initial tickets
        console.log('Setting initial tickets...');
        await set(ref(db, `users/${userId}/visits`), {
          maxPlaysToday: 6,  // Base 5 + 1 from invite
          playsRemaining: 6,
          playsToday: 0
        });
  
        // Verify the data was written
        const finalCheck = await get(ref(db, `users/${userId}`));
        console.log('Final data check:', finalCheck.val());
  
      } catch (error) {
        console.error('Error in processInviteLink:', error);
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