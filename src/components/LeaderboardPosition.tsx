import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);
  const [debugData, setDebugData] = useState<string[]>([]);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        const usersRef = ref(db, '/users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) return;

        const users = snapshot.val();
        
        // Get all users and their scores
        const userScores = Object.entries(users)
          .map(([id, data]: [string, any]) => ({
            userId: id,
            userName: data.userName || 'Unknown',
            totalScore: Number(data.totalScore || 0)
          }))
          .sort((a, b) => b.totalScore - a.totalScore);

        // Set debug data to show scores
        setDebugData(userScores.map(user => 
          `${user.userName}: ${user.totalScore}`
        ));

        // Calculate position
        const userPosition = userScores.findIndex(user => user.userId === userId) + 1;
        if (userPosition > 0) {
          setPosition(userPosition);
        }
      } catch (error) {
        setDebugData(['Error calculating position']);
      }
    };

    if (userId) {
      calculatePosition();
    }
  }, [userId]);

  return (
    <div style={{ position: 'relative' }}>
      <span>{position}</span>
      {/* Temporary debug overlay */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.9)',
        padding: '20px',
        borderRadius: '10px',
        color: '#0FF',
        zIndex: 9999,
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '10px' }}>Leaderboard Data:</div>
        {debugData.map((line, index) => (
          <div key={index} style={{ 
            color: line.includes(userId) ? '#FFD700' : '#0FF',
            marginBottom: '5px'
          }}>
            #{index + 1}. {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPosition;