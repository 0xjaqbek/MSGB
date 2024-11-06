import { getDatabase, ref, get, set } from 'firebase/database';

export interface UserVisit {
  lastVisit: string;
  currentStreak: number;
  highestStreak: number;
  totalVisits: number;
  dailyVisits: { [key: string]: number };
  firstVisitComplete: boolean;
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
}

export const trackUserVisit = async (userId: string, userName: string): Promise<VisitStats> => {
  const db = getDatabase();
  const userVisitsRef = ref(db, `users/${userId}/visits`);
  
  try {
    // Get current visit data
    const snapshot = await get(userVisitsRef);
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    if (!snapshot.exists()) {
      // First time user ever
      const initialVisit: UserVisit = {
        lastVisit: today,
        currentStreak: 1,
        highestStreak: 1,
        totalVisits: 1,
        dailyVisits: {
          [today]: 1
        },
        firstVisitComplete: false
      };
      
      await set(userVisitsRef, initialVisit);
      return { 
        ...initialVisit, 
        isNewDay: true, 
        isFirstVisit: true,
        todayVisits: 1
      };
    }
    
    const userData = snapshot.val() as UserVisit;
    const lastVisitDate = new Date(userData.lastVisit);
    const lastVisitDay = lastVisitDate.toISOString().split('T')[0];
    
    // Check if this is a new day
    const isNewDay = today !== lastVisitDay;
    
    // Calculate days between visits for streak
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let newStreak = userData.currentStreak;
    
    if (isNewDay) {
      // If last visit was yesterday, increment streak
      if (daysSinceLastVisit === 1) {
        newStreak = userData.currentStreak + 1;
      } 
      // If more than 1 day has passed, reset streak
      else if (daysSinceLastVisit > 1) {
        newStreak = 1;
      }
    }
    
    // Update daily visits count
    const dailyVisits = { ...userData.dailyVisits };
    dailyVisits[today] = (dailyVisits[today] || 0) + 1;
    
    const updatedVisit: UserVisit = {
      lastVisit: today,
      currentStreak: newStreak,
      highestStreak: Math.max(newStreak, userData.highestStreak),
      totalVisits: userData.totalVisits + 1, // Increment on every visit
      dailyVisits,
      firstVisitComplete: true
    };
    
    // Update visit history
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
      todayVisits: dailyVisits[today]
    };
  } catch (error) {
    console.error('Error tracking user visit:', error);
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
      todayVisits: userData.dailyVisits[today] || 0
    };
  } catch (error) {
    console.error('Error getting user visit stats:', error);
    throw error;
  }
};