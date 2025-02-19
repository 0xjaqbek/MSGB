import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

interface UserScore {
  userId: string;
  userName: string;
  totalScore: number;
}

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<UserScore[]>([]);

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
        
        // Create array of user scores with names
        const userScores: UserScore[] = Object.entries(users).map(([id, data]: [string, any]) => ({
          userId: id,
          userName: data.userName || 'Unknown',
          totalScore: Number(data.totalScore || 0)
        }));
        
        // Sort by score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);
        
        // Save debug info
        setDebugInfo(userScores);

        // Find position
        const userIndex = userScores.findIndex(user => user.userId === userId);
        const userPosition = userIndex + 1;
        
        if (userPosition > 0) {
          setPosition(userPosition);
        }
      } catch (error) {
        console.error('Error calculating leaderboard position:', error);
      }
    };

    calculatePosition();
  }, [userId]);

  // Temporary debug display
  return (
    <div style={{ 
      position: 'absolute', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.9)',
      padding: '20px',
      borderRadius: '10px',
      color: '#0FF',
      zIndex: 9999
    }}>
      <div>Your Position: {position}</div>
      <div style={{ marginTop: '10px' }}>All Scores:</div>
      {debugInfo.map((user, index) => (
        <div key={user.userId} style={{ 
          color: user.userId === userId ? '#FFD700' : '#0FF',
          marginTop: '5px'
        }}>
          #{index + 1}. {user.userName}: {user.totalScore}
        </div>
      ))}
    </div>
  );
};

export default LeaderboardPosition;