import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<{userName: string, score: number}[]>([]);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        const usersRef = ref(db, '/users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) return;

        // Get all users with their scores and names
        const userScores = Object.entries(snapshot.val())
          .map(([id, data]: [string, any]) => ({
            userId: id,
            userName: data.userName || 'Unknown',
            score: Number(data.totalScore || 0)
          }))
          .filter(user => !isNaN(user.score));

        // Store debug info
        setDebugInfo(userScores.map(user => ({
          userName: user.userName,
          score: user.score
        })));

        // Sort by score in descending order
        userScores.sort((a, b) => b.score - a.score);

        // Find user's position
        const userIndex = userScores.findIndex(user => user.userId === userId);
        if (userIndex !== -1) {
          setPosition(userIndex + 1);
        }
      } catch (error) {
        setDebugInfo([{userName: 'Error loading data', score: 0}]);
      }
    };

    if (userId) {
      calculatePosition();
    }
  }, [userId]);

  return (
    <div style={{ position: 'relative' }}>
      <span>{position}</span>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.9)',
        padding: '20px',
        borderRadius: '10px',
        color: '#0FF',
        zIndex: 9999
      }}>
        <div style={{ marginBottom: '10px' }}>User Scores:</div>
        {debugInfo.sort((a, b) => b.score - a.score).map((user, index) => (
          <div key={index}>
            #{index + 1}. {user.userName}: {user.score}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPosition;