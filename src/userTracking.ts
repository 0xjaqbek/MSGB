import { getDatabase, ref, get, set, update } from 'firebase/database';

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
  }

const calculateMaxPlays = (streak: number): number => {
  return 5 + (streak - 1); // Base 5 plays + bonus from streak
};

export const trackUserVisit = async (userId: string, userName: string): Promise<VisitStats> => {
  const db = getDatabase();
  const userRef = ref(db, `users/${userId}`);
  
  try {
    const snapshot = await get(userRef);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get existing data to preserve referral info
    const existingData = snapshot.exists() ? snapshot.val() : {};
    const referralInfo = existingData.referralInfo;
    
    // Calculate maxPlays based on referral status
    const baseMaxPlays = referralInfo?.invitedBy ? 6 : 5; // 6 if invited, 5 if not
    
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
        playsRemaining: baseMaxPlays,
        playsToday: 0,
        maxPlaysToday: baseMaxPlays
      };
      
      // Preserve referral info when setting initial data
      await set(userRef, {
        ...existingData,
        visits: initialVisit
      });
      
      return initialVisit;
    }
    
    const userData = snapshot.val();
    const lastVisitDate = new Date(userData.visits.lastVisit);
    const lastVisitDay = lastVisitDate.toISOString().split('T')[0];
    const isNewDay = today !== lastVisitDay;
    
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let newStreak = userData.visits.currentStreak;
    if (isNewDay) {
      if (daysSinceLastVisit === 1) {
        newStreak = userData.visits.currentStreak + 1;
      } else if (daysSinceLastVisit > 1) {
        newStreak = 1;
      }
    }
    
    const dailyVisits = { ...(userData.visits.dailyVisits || {}) };
    dailyVisits[today] = (dailyVisits[today] || 0) + 1;
    
    const updatedVisit: VisitStats = {
      lastVisit: today,
      currentStreak: newStreak,
      highestStreak: Math.max(newStreak, userData.visits.highestStreak || 1),
      totalVisits: (userData.visits.totalVisits || 0) + 1,
      dailyVisits,
      firstVisitComplete: true,
      isNewDay,
      isFirstVisit: !userData.visits.firstVisitComplete,
      todayVisits: dailyVisits[today],
      playsRemaining: baseMaxPlays,
      playsToday: 0,
      maxPlaysToday: baseMaxPlays
    };
    
    // Preserve referral info when updating
    await update(userRef, {
      visits: updatedVisit,
      referralInfo: referralInfo || {} // Keep existing referral info
    });
    
    return updatedVisit;
  } catch (error) {
    console.error('Error tracking user visit:', error);
    throw error;
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