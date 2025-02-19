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

        const users = snapshot.val();
        
        // Debug log to see all users and scores
        console.log('All users and scores:', Object.entries(users).map(([id, data]: [string, any]) => ({
          userId: id,
          userName: data.userName,
          totalScore: Number(data.totalScore || 0)
        })));

        // Create array of user scores
        const userScores = Object.entries(users).map(([id, data]: [string, any]) => ({
          userId: id,
          totalScore: Number(data.totalScore || 0)
        }));
        
        // Sort by score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);
        
        // Debug log sorted scores
        console.log('Sorted scores:', userScores);

        // Find position (add 1 because array index starts at 0)
        const userIndex = userScores.findIndex(user => user.userId === userId);
        const userPosition = userIndex + 1;
        
        // Debug log position calculation
        console.log('User position calculation:', {
          userId,
          userIndex,
          userPosition,
          userScore: userScores.find(user => user.userId === userId)?.totalScore
        });

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