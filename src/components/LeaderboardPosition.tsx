import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get, update } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        const usersRef = ref(db, '/users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) return;

        // Get all users and map to simple score objects
        const userScores = Object.entries(snapshot.val())
          .filter(([_, data]: [string, any]) => typeof data.totalScore === 'number' || typeof data.totalScore === 'string')
          .map(([id, data]: [string, any]) => ({
            userId: id,
            totalScore: parseInt(data.totalScore) || 0,
            userName: data.userName
          }));

        // Sort by score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);
        
        // Find user's position
        const userPosition = userScores.findIndex(user => user.userId === userId) + 1;
        
        if (userPosition > 0) {
          setPosition(userPosition);
        }

        // For debugging in production
        const userScore = userScores.find(u => u.userId === userId);
        if (userScore) {
          const topScores = userScores.slice(0, 5).map(u => `${u.userName}: ${u.totalScore}`);
          await update(ref(db, `debug/leaderboard`), {
            timestamp: Date.now(),
            scores: topScores,
            userScore: `${userScore.userName}: ${userScore.totalScore}`,
            calculatedPosition: userPosition
          });
        }
      } catch (error) {
        console.error('Error calculating leaderboard position:', error);
      }
    };

    if (userId) {
      calculatePosition();
    }
  }, [userId]);

  return <span>{position}</span>;
};

export default LeaderboardPosition;