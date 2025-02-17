import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(0);

  useEffect(() => {
    const calculatePosition = async () => {
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
        totalScore: Number(userData.totalScore) || 0
      }));

      userScores.sort((a, b) => b.totalScore - a.totalScore);
      const userPosition = userScores.findIndex(user => user.userId === userId) + 1;
      setPosition(userPosition);
    };

    calculatePosition();
  }, [userId]);

  return <span>{position}</span>;
};

export default LeaderboardPosition;