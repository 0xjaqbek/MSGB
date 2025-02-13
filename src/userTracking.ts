import { getDatabase, ref, get, set, update } from 'firebase/database';
import { calculateAvailableTickets } from './ticketManagement';

export interface UserVisit {
  lastVisit: string;
  currentStreak: number;
  highestStreak: number;
  totalVisits: number;
  dailyVisits: { [key: string]: number };
  firstVisitComplete: boolean;
  playsToday: number;  // Added for plays tracking
  maxPlaysToday: number;  // Added for plays tracking
}

export interface VisitHistoryEntry {
  timestamp: string;
  userName: string;
  streak: number;
}

export interface VisitStats {
  lastVisit: string;
  currentStreak: number;
  highestStreak: number;
  totalVisits: number;
  dailyVisits: { [key: string]: number };
  firstVisitComplete: boolean;
  isNewDay: boolean;
  isFirstVisit: boolean;
  todayVisits: number;
  playsRemaining: number;
  playsToday: number;
  maxPlaysToday: number;
  ticketsFromInvites?: number;
}

const calculateMaxPlays = (streak: number): number => {
  return 5 + (streak - 1); // Base 5 plays + bonus from streak
};

export const trackUserVisit = async (userId: string, userFirstName: string, username?: string): Promise<VisitStats> => {
  const db = getDatabase();
  const userRef = ref(db, `users/${userId}`);
  
  try {
    const snapshot = await get(userRef);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Use username if available, otherwise use first name
    const displayName = username || userFirstName;
    
    // Get max tickets available
    const maxTickets = await calculateAvailableTickets(userId);
    
    // If user doesn't exist, create initial user data
    if (!snapshot.exists()) {
      const initialVisit: VisitStats = {
        lastVisit: today,
        currentStreak: 1,
        highestStreak: 1,
        totalVisits: 1,
        dailyVisits: { [today]: 1 },
        firstVisitComplete: false,
        isNewDay: true,
        isFirstVisit: true,
        todayVisits: 1,
        playsRemaining: maxTickets, 
        playsToday: 0,
        maxPlaysToday: maxTickets,
        ticketsFromInvites: 0
      };
      
      await set(userRef, { 
        visits: initialVisit,
        userId: userId,
        userName: displayName,
        userFirstName: userFirstName,
        username: username || null,
        displayName: `${displayName} (${userId})`,
        referrals: {
          ticketsFromInvites: 0,
          invitedUsers: []
        },
        plays: {
          today: 0,
          max: maxTickets,
          remaining: maxTickets,
          lastPlayed: null
        }
      });
      
      return {
        ...initialVisit,
        playsRemaining: maxTickets,
        playsToday: 0,
        maxPlaysToday: maxTickets
      };
    }
    
    // For existing users, update their name info if changed
    const userData = snapshot.val();
    if (userData.userName !== displayName || 
        userData.userFirstName !== userFirstName || 
        userData.username !== username) {
      await update(userRef, {
        userName: displayName,
        userFirstName: userFirstName,
        username: username || null,
        displayName: `${displayName} (${userId})`
      });
    }
    const existingVisits = userData.visits || {};
    const ticketsFromInvites = userData.referrals?.ticketsFromInvites || 0;
    const plays = userData.plays || { today: 0, max: maxTickets, remaining: maxTickets };
    
    const processedVisits: VisitStats = {
      lastVisit: existingVisits.lastVisit || today,
      currentStreak: existingVisits.currentStreak || 1,
      highestStreak: existingVisits.highestStreak || 1,
      totalVisits: (existingVisits.totalVisits || 0) + 1,
      dailyVisits: existingVisits.dailyVisits || { [today]: 1 },
      firstVisitComplete: existingVisits.firstVisitComplete || false,
      isNewDay: today !== existingVisits.lastVisit,
      isFirstVisit: !existingVisits.firstVisitComplete,
      todayVisits: (existingVisits.dailyVisits?.[today] || 0) + 1,
      ticketsFromInvites,
      playsRemaining: plays.remaining,
      playsToday: plays.today,
      maxPlaysToday: plays.max
    };
    
    if (processedVisits.isNewDay) {
      plays.today = 0;
      plays.max = maxTickets;
      plays.remaining = maxTickets;
    }
    
    await update(userRef, { 
      visits: processedVisits,
      plays
    });
    
    return processedVisits;
  } catch (error) {
    console.error('Error in trackUserVisit:', error);
    return {
      lastVisit: new Date().toISOString().split('T')[0],
      currentStreak: 1,
      highestStreak: 1,
      totalVisits: 1,
      dailyVisits: {},
      firstVisitComplete: false,
      isNewDay: true,
      isFirstVisit: true,
      todayVisits: 1,
      playsRemaining: 5,
      playsToday: 0,
      maxPlaysToday: 5,
      ticketsFromInvites: 0
    };
  }
};

export const updatePlayCount = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const userVisitsRef = ref(db, `users/${userId}/visits`);
  
  try {
    const snapshot = await get(userVisitsRef);
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }
    
    const userData = snapshot.val() as UserVisit;
    const newPlaysCount = userData.playsToday + 1;
    
    if (newPlaysCount > userData.maxPlaysToday) {
      return -1; // No plays remaining
    }
    
    await set(userVisitsRef, {
      ...userData,
      playsToday: newPlaysCount
    });
    
    return userData.maxPlaysToday - newPlaysCount; // Return remaining plays
  } catch (error) {
    console.error('Error updating play count:', error);
    throw error;
  }
};

export const getUserVisitStats = async (userId: string): Promise<VisitStats | null> => {
  const db = getDatabase();
  const userVisitsRef = ref(db, `users/${userId}/visits`);
  
  try {
    const snapshot = await get(userVisitsRef);
    if (!snapshot.exists()) {
      return null;
    }
    const userData = snapshot.val() as UserVisit;
    const today = new Date().toISOString().split('T')[0];
    
    return {
      ...userData,
      isNewDay: today !== userData.lastVisit,
      isFirstVisit: !userData.firstVisitComplete,
      todayVisits: userData.dailyVisits[today] || 0,
      playsRemaining: userData.maxPlaysToday - userData.playsToday
    };
  } catch (error) {
    console.error('Error getting user visit stats:', error);
    throw error;
  }
};