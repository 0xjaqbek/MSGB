import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';

const LeaderboardPosition = ({ userId }: { userId: string }) => {
  const [position, setPosition] = useState<number>(1);

  useEffect(() => {
    const calculatePosition = async () => {
      try {
        const db = getDatabase();
        
        // First get your own data
        const currentUserRef = ref(db, `/users/${userId}`);
        const currentUserSnap = await get(currentUserRef);
        
        if (!currentUserSnap.exists()) {
          return;
        }

        const currentUserScore = Number(currentUserSnap.val().totalScore || 0);
        let higherScores = 0;

        // Get Mawenka's score (we know they exist)
        const mawenkaRef = ref(db, '/users/7347127444');
        const mawenkaSnap = await get(mawenkaRef);
        if (mawenkaSnap.exists()) {
          const mawenkaScore = Number(mawenkaSnap.val().totalScore || 0);
          if (mawenkaScore > currentUserScore) {
            higherScores++;
          }
        }

        // Get Jaqbek's score
        const jaqbekRef = ref(db, '/users/955686659');
        const jaqbekSnap = await get(jaqbekRef);
        if (jaqbekSnap.exists()) {
          const jaqbekScore = Number(jaqbekSnap.val().totalScore || 0);
          if (jaqbekScore > currentUserScore) {
            higherScores++;
          }
        }

        // Calculate position (add 1 because positions start at 1)
        setPosition(higherScores + 1);
        
      } catch (error: any) {
        console.error('Error calculating position:', error);
      }
    };

    if (userId) {
      calculatePosition();
    }
  }, [userId]);

  return <span>{position}</span>;
};

export default LeaderboardPosition;