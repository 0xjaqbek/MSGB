import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        const scoresRef = ref(db, '/users');
        const snapshot = await get(scoresRef);
        
        if (!snapshot.exists()) return;

        // Get all users and their scores
        const scores = Object.entries(snapshot.val())
          .map(([id, data]: [string, any]) => ({
            userId: id,
            score: Number(data.totalScore || 0)
          }))
          .filter(user => !isNaN(user.score));

        // Sort by score in descending order
        const sortedScores = scores.sort((a, b) => b.score - a.score);

        // Find position
        const userPosition = sortedScores.findIndex(user => user.userId === userId) + 1;
        if (userPosition > 0) {
          setPosition(userPosition);
        }
      } catch (error) {
        // In production, silently handle error and keep default position of 1
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