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
        
        if (!snapshot.exists()) return;

        // Get all users with their scores
        const userScores = Object.entries(snapshot.val())
          .map(([id, data]: [string, any]) => ({
            userId: id,
            totalScore: Number(data.totalScore || 0)
          }))
          .filter(user => !isNaN(user.totalScore)); // Filter out invalid scores

        // Sort by score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);

        // Find user's position
        const userIndex = userScores.findIndex(user => user.userId === userId);
        if (userIndex !== -1) {
          setPosition(userIndex + 1);
        }
      } catch (error) {
        console.error('Error calculating position:', error);
      }
    };

    if (userId) {
      calculatePosition();
    }
  }, [userId]);

  return <span>{position}</span>;
};

export default LeaderboardPosition;