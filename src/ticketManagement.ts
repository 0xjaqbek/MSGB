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
  
// In ticketManagement.ts
export const processInviteLink = async (userId: string, startParam: string) => {
    const db = getDatabase();
    
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      console.log('Processing referral from:', referrerId, 'for user:', userId);
      
      // Don't allow self-referral
      if (referrerId === userId) {
        return;
      }
      
      try {
        // Create full paths for database references
        const referrerPath = `users/${referrerId}`;
        const newUserPath = `users/${userId}`;
        
        // Get current data
        const [referrerSnapshot, userSnapshot] = await Promise.all([
          get(ref(db, referrerPath)),
          get(ref(db, newUserPath))
        ]);
  
        const referrerData = referrerSnapshot.val() || {};
        const userData = userSnapshot.val() || {};
  
        console.log('Current data:', { referrerData, userData });
  
        // Update referrer data
        await update(ref(db, referrerPath), {
          'referrals/invitedUsers': [...(referrerData.referrals?.invitedUsers || []), userId],
          'referrals/ticketsFromInvites': (referrerData.referrals?.ticketsFromInvites || 0) + 1,
          'visits/maxPlaysToday': (referrerData.visits?.maxPlaysToday || 5) + 1
        });
  
        // Update new user data
        await update(ref(db, newUserPath), {
          'referrals/invitedBy': referrerId,
          'referrals/ticketsFromInvites': 1,
          'referrals/invitedUsers': [],
          'visits/maxPlaysToday': 6  // Base 5 + 1 from being invited
        });
  
        console.log('Successfully processed invite link');
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