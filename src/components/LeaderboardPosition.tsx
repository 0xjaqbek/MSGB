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
        const userScores = Object.entries(users).map(([id, userData]: [string, any]) => ({
          userId: id,
          totalScore: Number(userData.totalScore) || 0,
          userName: userData.userName
        }));

        // Sort by score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);
        
        console.log('Sorted Leaderboard:', userScores.map(user => 
          `${user.userName}: ${user.totalScore}`
        ));

        // Find position (add 1 because array index starts at 0)
        const position = userScores.findIndex(user => user.userId === userId) + 1;
        
        console.log(`User ${userId} position: ${position}`);
        
        // Only update if we found a valid position
        if (position > 0) {
          setPosition(position);
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