import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        const usersRef = ref(db, '/users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
          setPosition(1);
          return;
        }

        // Convert to array and ensure all scores are numbers
        const userScores = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          userId: id,
          totalScore: Number(data.totalScore || 0)  // Convert to number, default to 0
        }));

        // Sort by score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);
        
        // Find position (1-based index)
        const userPosition = userScores.findIndex(user => user.userId === userId) + 1;
        
        // Set position only if user was found
        if (userPosition > 0) {
          setPosition(userPosition);
        }
      } catch (error) {
        console.error('Error calculating leaderboard position:', error);
      }
    };

    calculatePosition();
  }, [userId]);

  return <span>{position}</span>;
};

export default LeaderboardPosition;