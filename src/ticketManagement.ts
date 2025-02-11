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



interface InviteData {
    invitedBy?: string;
    invitedFriends: string[];
    timestamp: number;
  }
  
  export const processInviteLink = async (userId: string, startParam: string) => {
    console.log('Processing invite link:', { userId, startParam });
    const db = getDatabase();
    
    if (startParam?.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      
      // Don't allow self-referral
      if (referrerId === userId) {
        console.log('Self-referral detected, ignoring');
        return;
      }
      
      const referrerRef = ref(db, `users/${referrerId}`);
      const userRef = ref(db, `users/${userId}`);
      
      try {
        const [referrerSnapshot, userSnapshot] = await Promise.all([
          get(referrerRef),
          get(userRef)
        ]);
  
        console.log('Current data:', {
          referrerData: referrerSnapshot.val(),
          userData: userSnapshot.val()
        });
  
        const referrerData = referrerSnapshot.val() || {};
        const userData = userSnapshot.val() || {};
  
        // Check if user has already been invited
        if (userData.invitedBy) {
          console.log('User already invited by:', userData.invitedBy);
          return;
        }
  
        // Update referrer data
        const updatedReferrerData = {
          ...referrerData,
          permanentBonusTickets: (referrerData.permanentBonusTickets || 0) + 1,
          invites: {
            invitedFriends: [...(referrerData.invites?.invitedFriends || []), userId],
            timestamp: Date.now()
          }
        };
  
        // Update new user data
        const updatedUserData = {
          ...userData,
          invitedBy: referrerId,
          permanentBonusTickets: 1,
          invites: {
            invitedFriends: [],
            timestamp: Date.now()
          }
        };
  
        console.log('Updating data:', {
          referrer: updatedReferrerData,
          user: updatedUserData
        });
  
        // Update both users
        await Promise.all([
          set(referrerRef, updatedReferrerData),
          set(userRef, updatedUserData)
        ]);
  
        console.log('Invite processing complete');
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
      console.log('User data for ticket calculation:', {
        userId,
        data: snapshot.val()
      });
  
      if (!snapshot.exists()) {
        console.log('No user data found, returning base tickets (5)');
        return 5;
      }
  
      const userData = snapshot.val();
      
      // Calculate components
      const baseTickets = 5;
      const streakBonus = Math.max(0, (userData.visits?.currentStreak || 1) - 1);
      const permanentBonus = userData.permanentBonusTickets || 0;
      
      const totalTickets = baseTickets + streakBonus + permanentBonus;
      
      console.log('Ticket calculation:', {
        baseTickets,
        streakBonus,
        permanentBonus,
        totalTickets
      });
      
      return totalTickets;
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