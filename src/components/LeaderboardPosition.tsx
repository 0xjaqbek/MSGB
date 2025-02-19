import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<string>('Loading...');

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        
        // First try to get current user's data
        const currentUserRef = ref(db, `/users/${userId}`);
        const currentUserSnap = await get(currentUserRef);
        
        if (!currentUserSnap.exists()) {
          setDebugInfo('Current user not found');
          return;
        }

        const currentUser = currentUserSnap.val();
        setDebugInfo(`Your score: ${currentUser.totalScore || 0}\n`);

        // Now try to get all users
        const usersRef = ref(db, '/users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
          setDebugInfo(prev => prev + '\nNo users found');
          return;
        }

        const users = snapshot.val();
        const userScores = Object.entries(users)
          .map(([id, data]: [string, any]) => ({
            userId: id,
            userName: data.userName || 'Unknown',
            score: Number(data.totalScore || 0)
          }))
          .filter(user => !isNaN(user.score))
          .sort((a, b) => b.score - a.score);

        // Update debug info with the sorted scores
        setDebugInfo(prev => prev + '\n\nAll scores:\n' + 
          userScores.map((user, index) => 
            `#${index + 1}. ${user.userName}: ${user.score}`
          ).join('\n')
        );

        const userIndex = userScores.findIndex(user => user.userId === userId);
        if (userIndex !== -1) {
          setPosition(userIndex + 1);
          setDebugInfo(prev => prev + `\n\nYour position: ${userIndex + 1}`);
        }
      } catch (error: any) {
        setDebugInfo(
          'Error details:\n' +
          `Message: ${error.message}\n` +
          `Code: ${error.code}\n` +
          `Path: ${error.path || 'unknown'}`
        );
      }
    };

    calculatePosition();
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
        whiteSpace: 'pre-wrap',
        maxWidth: '80vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {debugInfo}
      </div>
    </div>
  );
};

export default LeaderboardPosition;