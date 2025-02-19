import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<string>('Loading...');

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        // First verify we have a valid userId
        setDebugInfo(`Checking userId: ${userId}`);

        const db = getDatabase();
        const usersRef = ref(db, '/users');
        
        // Get all users data
        const snapshot = await get(usersRef);
        if (!snapshot.exists()) {
          setDebugInfo('No users found in database');
          return;
        }

        const users = snapshot.val();
        setDebugInfo(`Found ${Object.keys(users).length} users\n`);

        // Get current user data
        const currentUser = users[userId];
        if (!currentUser) {
          setDebugInfo('Current user not found in database');
          return;
        }

        setDebugInfo(debugInfo => debugInfo + `\nCurrent user score: ${currentUser.totalScore}`);

        // Map and sort users
        const userScores = Object.entries(users)
          .filter(([_, data]: [string, any]) => data && data.totalScore !== undefined)
          .map(([id, data]: [string, any]) => ({
            userId: id,
            userName: data.userName || 'Unknown',
            totalScore: Number(data.totalScore || 0)
          }));

        setDebugInfo(debugInfo => debugInfo + `\nFound ${userScores.length} users with scores`);

        // Sort by score
        userScores.sort((a, b) => b.totalScore - a.totalScore);

        // Find position
        const userPosition = userScores.findIndex(user => user.userId === userId) + 1;
        
        setDebugInfo(debugInfo => 
          debugInfo + 
          `\n\nTop 3 scores:${
            userScores.slice(0, 3).map(user => 
              `\n${user.userName}: ${user.totalScore}`
            )
          }`
        );

        if (userPosition > 0) {
          setPosition(userPosition);
          setDebugInfo(debugInfo => debugInfo + `\n\nYour position: ${userPosition}`);
        }
      } catch (error: any) {
        setDebugInfo(`Error: ${error.message}\nStack: ${error.stack}`);
      }
    };

    calculatePosition();
  }, [userId]);

  return (
    <div style={{ position: 'relative' }}>
      <span>{position}</span>
      {/* Debug overlay */}
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