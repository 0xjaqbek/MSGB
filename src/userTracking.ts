import { getDatabase, ref, get, set } from 'firebase/database';

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

export interface VisitStats extends UserVisit {
  isNewDay: boolean;
  isFirstVisit: boolean;
  todayVisits: number;
  playsRemaining: number;  // Added for plays tracking
}

const calculateMaxPlays = (streak: number): number => {
  return 5 + (streak - 1); // Base 5 plays + bonus from streak
};

export const trackUserVisit = async (userId: string, userName: string): Promise<VisitStats> => {
  const db = getDatabase();
  const userVisitsRef = ref(db, `users/${userId}/visits`);
  
  try {
    const snapshot = await get(userVisitsRef);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (!snapshot.exists()) {
      // First time user ever
      const maxPlays = calculateMaxPlays(1);
      const initialVisit: UserVisit = {
        lastVisit: today,
        currentStreak: 1,
        highestStreak: 1,
        totalVisits: 1,
        dailyVisits: {
          [today]: 1
        },
        firstVisitComplete: false,
        playsToday: 0,
        maxPlaysToday: maxPlays
      };
      
      await set(userVisitsRef, initialVisit);
      return { 
        ...initialVisit, 
        isNewDay: true, 
        isFirstVisit: true,
        todayVisits: 1,
        playsRemaining: maxPlays
      };
    }
    
    const userData = snapshot.val() as UserVisit;
    const lastVisitDate = new Date(userData.lastVisit);
    const lastVisitDay = lastVisitDate.toISOString().split('T')[0];
    
    const isNewDay = today !== lastVisitDay;
    
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let newStreak = userData.currentStreak;
    
    if (isNewDay) {
      if (daysSinceLastVisit === 1) {
        newStreak = userData.currentStreak + 1;
      } else if (daysSinceLastVisit > 1) {
        newStreak = 1;
      }
    }
    
    // Calculate new max plays based on streak
    const maxPlays = calculateMaxPlays(newStreak);
    
    // Reset plays for new day or keep current
    const playsToday = isNewDay ? 0 : userData.playsToday;
    
    const dailyVisits = { ...userData.dailyVisits };
    dailyVisits[today] = (dailyVisits[today] || 0) + 1;
    
    const updatedVisit: UserVisit = {
      lastVisit: today,
      currentStreak: newStreak,
      highestStreak: Math.max(newStreak, userData.highestStreak),
      totalVisits: userData.totalVisits + 1,
      dailyVisits,
      firstVisitComplete: true,
      playsToday,
      maxPlaysToday: maxPlays
    };
    
    const visitHistoryRef = ref(db, `users/${userId}/visitHistory/${now.getTime()}`);
    const historyEntry: VisitHistoryEntry = {
      timestamp: now.toISOString(),
      userName: userName,
      streak: newStreak
    };
    await set(visitHistoryRef, historyEntry);
    
    await set(userVisitsRef, updatedVisit);
    
    return {
      ...updatedVisit,
      isNewDay,
      isFirstVisit: !userData.firstVisitComplete,
      todayVisits: dailyVisits[today],
      playsRemaining: maxPlays - playsToday
    };
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