import React, { useEffect, useState } from 'react';
import { getDatabase, ref, query, orderByChild, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<Array<{
    userId: string,
    userName: string,
    score: number
  }>>([]);

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
            userName: data.userName || 'Unknown',
            score: Number(data.totalScore || 0)
          }))
          .filter(user => !isNaN(user.score));

        // Sort by score in descending order
        const sortedScores = [...scores].sort((a, b) => b.score - a.score);
        setDebugInfo(sortedScores);

        // Find position
        const userPosition = sortedScores.findIndex(user => user.userId === userId) + 1;
        if (userPosition > 0) {
          setPosition(userPosition);
        }
      } catch (error) {
        setDebugInfo([{
          userId: 'error',
          userName: 'Error loading data',
          score: 0
        }]);
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
        zIndex: 9999,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: '10px', color: '#FFD700' }}>Leaderboard:</div>
        {debugInfo.map((user, index) => (
          <div key={user.userId} style={{ 
            color: user.userId === userId ? '#FFD700' : '#0FF',
            marginBottom: '8px'
          }}>
            #{index + 1}. {user.userName}: {user.score} points
            {user.userId === userId ? ' (YOU)' : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPosition;