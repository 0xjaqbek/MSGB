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
        playsRemaining: 5,  // Default initial plays
        playsToday: 0,
        maxPlaysToday: 5
      };
      
      // Set initial data
      await set(userRef, { 
        visits: initialVisit,
        userId: userId,
        userName: userName
      });
      
      return initialVisit;
    }
    
    // Existing user logic
    const userData = snapshot.val();
    const existingVisits = userData.visits || {};
    
    // Provide default values if any property is missing
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
      playsRemaining: existingVisits.playsRemaining || 5,
      playsToday: (existingVisits.playsToday || 0) + 1,
      maxPlaysToday: existingVisits.maxPlaysToday || 5
    };
    
    // Update user data
    await update(userRef, { 
      visits: processedVisits 
    });
    
    return processedVisits;
  } catch (error) {
    console.error('Error in trackUserVisit:', error);
    
    // Fallback to a default state if everything fails
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
      maxPlaysToday: 5
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