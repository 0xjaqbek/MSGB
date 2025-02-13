// src/utils/leaderboardUtils.ts
import { getDatabase, ref, get } from 'firebase/database';

export const calculateLeaderboardPosition = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const allScoresRef = ref(db, '/');
  
  try {
    const snapshot = await get(allScoresRef);
    if (!snapshot.exists()) return 0;

    // Get all users and their scores
    const users = snapshot.val();
    const userScores: { userId: string; totalPoints: number }[] = [];

    // Calculate total points for each user
    for (const [id, userData] of Object.entries(users)) {
      if (typeof userData === 'object' && userData !== null && 'scores' in userData) {
        const scores = Object.values(userData.scores as Record<string, { score: number }>);
        const totalPoints = scores.reduce((sum, entry) => sum + (entry.score || 0), 0);
        userScores.push({ userId: id, totalPoints });
      }
    }

    // Sort users by score in descending order
    userScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // Find position of current user
    const position = userScores.findIndex(user => user.userId === userId) + 1;
    return position;
  } catch (error) {
    console.error('Error calculating leaderboard position:', error);
    return 0;
  }
};