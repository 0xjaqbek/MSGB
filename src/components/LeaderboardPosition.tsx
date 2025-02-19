import React, { useEffect, useState } from 'react';
import { getDatabase, ref, query, orderByChild, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        const scoresRef = ref(db, '/users');
        
        // Get all users sorted by totalScore
        const usersQuery = query(scoresRef, orderByChild('totalScore'));
        const snapshot = await get(usersQuery);
        
        if (!snapshot.exists()) return;

        // Convert to array and sort in descending order (highest score first)
        const sortedScores = Object.entries(snapshot.val())
          .map(([id, data]: [string, any]) => ({
            userId: id,
            score: Number(data.totalScore || 0)
          }))
          .filter(user => !isNaN(user.score))
          .sort((a, b) => b.score - a.score);

        // Find position (add 1 because array indices start at 0)
        const userPosition = sortedScores.findIndex(user => user.userId === userId) + 1;
        if (userPosition > 0) {
          setPosition(userPosition);
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