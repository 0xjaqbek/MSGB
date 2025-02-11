import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { TelegramUser } from './types';

interface FriendsPageProps {
  telegramUser: TelegramUser | null;
}

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  const [friendCode, setFriendCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState('');
  const [friendCount, setFriendCount] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch existing friend code and friend count
  useEffect(() => {
    if (!telegramUser) return;

    const fetchInitialData = async () => {
      const db = getDatabase();
      
      // Fetch friend code
      try {
        const codesRef = ref(db, 'friendCodes');
        const codesSnapshot = await get(codesRef);
        
        if (codesSnapshot.exists()) {
          const codes = codesSnapshot.val();
          for (const [code, data] of Object.entries(codes)) {
            if (typeof data === 'object' && data !== null && 'userId' in data) {
              if (data.userId === telegramUser.id) {
                setFriendCode(code as string);
                break;
              }
            }
          }
        }

        // Fetch friend count
        const friendsRef = ref(db, `users/${telegramUser.id}/friends`);
        const friendsSnapshot = await get(friendsRef);
        
        if (friendsSnapshot.exists()) {
          setFriendCount(Object.keys(friendsSnapshot.val()).length);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [telegramUser]);

  const handleGenerateCode = async () => {
    console.log('Generate Code button clicked');
    if (!telegramUser) {
        console.log('Error: No telegram user found');
        setMessage('Error: Not authorized');
        return;
    }
    
    try {
        console.log('Generating code for user:', telegramUser.id);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log('Generated code:', code);
        
        const db = getDatabase();
        console.log('Got database reference');

        // First check if user already has a code
        console.log('Checking existing codes for user');
        const allCodesRef = ref(db, 'friendCodes');
        const allCodesSnapshot = await get(allCodesRef);
        
        if (allCodesSnapshot.exists()) {
            console.log('Found existing codes, checking for user codes');
            const allCodes = allCodesSnapshot.val();
            for (const [existingCode, data] of Object.entries(allCodes)) {
                if (typeof data === 'object' && data !== null && 'userId' in data) {
                    if (data.userId === telegramUser.id) {
                        console.log('User already has code:', existingCode);
                        setFriendCode(existingCode as string);
                        setMessage('Your existing code was found');
                        return;
                    }
                }
            }
        }
        
        // No existing code found, create new one
        console.log('No existing code found, creating new one');
        const codeRef = ref(db, `friendCodes/${code}`);
        
        // Check if this specific code already exists
        const codeSnapshot = await get(codeRef);
        if (codeSnapshot.exists()) {
            console.log('Code collision detected, retrying');
            setMessage('Please try again (code collision)');
            return;
        }

        // Create the code entry
        const codeData = {
            userId: telegramUser.id,
            userName: telegramUser.first_name,
            createdAt: Date.now(),
            status: 'active'
        };
        
        console.log('Attempting to save code:', code, 'with data:', codeData);
        await set(codeRef, codeData);
        
        console.log('Code saved successfully');
        setFriendCode(code);
        setMessage('New code generated successfully!');
        
        // Update user's reference to their code
        const userCodesRef = ref(db, `users/${telegramUser.id}/activeCodes/${code}`);
        await set(userCodesRef, {
            code: code,
            createdAt: Date.now()
        });
        console.log('Updated user code reference');

    } catch (error) {
        console.error('Error in handleGenerateCode:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        setMessage('Error generating code. Please try again.');
    }
};

  const handleInvite = () => {
    if (!telegramUser) {
      setMessage('Error: User not found');
      return;
    }

    try {
      const inviteLink = `https://t.me/moonstonesgamebot?start=invite_${telegramUser.id}`;
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          setMessage('Invite link copied to clipboard!');
          setTimeout(() => setMessage(''), 3000);
        })
        .catch(() => {
          setMessage('Failed to copy link');
        });
    } catch (error) {
      console.error('Error in handleInvite:', error);
      setMessage('Error sharing invite link');
    }
  };

  const handleRedeemCode = async () => {
    if (!telegramUser || !inputCode || isRedeeming) return;
    
    setIsRedeeming(true);
    try {
      const db = getDatabase();
      const codeRef = ref(db, `friendCodes/${inputCode}`);
      const snapshot = await get(codeRef);
      
      if (!snapshot.exists()) {
        setMessage('Invalid code');
        return;
      }
      
      const codeData = snapshot.val();
      if (codeData.userId === telegramUser.id) {
        setMessage('Cannot use your own code');
        return;
      }
      
      // Check if already friends
      const existingFriendRef = ref(db, `users/${telegramUser.id}/friends/${codeData.userId}`);
      const existingFriendSnapshot = await get(existingFriendRef);
      
      if (existingFriendSnapshot.exists()) {
        setMessage('Already friends with this user');
        return;
      }
      
      // Add friends connection
      await set(ref(db, `users/${telegramUser.id}/friends/${codeData.userId}`), {
        addedAt: Date.now()
      });
      
      await set(ref(db, `users/${codeData.userId}/friends/${telegramUser.id}`), {
        addedAt: Date.now()
      });
      
      // Increment invited friends count
      const userRef = ref(db, `users/${codeData.userId}/invitedFriends`);
      const userSnapshot = await get(userRef);
      const currentInvites = userSnapshot.exists() ? userSnapshot.val() : 0;
      await set(userRef, currentInvites + 1);
      
      // Remove used code
      await set(codeRef, null);
      
      setMessage('Friend added successfully!');
      setInputCode('');
      setFriendCount(prev => prev + 1);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error redeeming code:', error);
      setMessage('Error redeeming code. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <h1 className="text-glow text-xl mb-4">Friends</h1>
      
      <div className="card">
        <div className="stat-row">
          <span className="text-info">Friends Count:</span>
          <span className="text-value">{friendCount}</span>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Invite Friends</h2>
        <button 
          onClick={handleInvite}
          className="w-full p-4 mb-4 border-2 border-cyan-400 text-cyan-400 rounded-xl hover:bg-cyan-400/10"
        >
          Share Game Link
        </button>
      </div>
      
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Friend Code</h2>
        {friendCode ? (
          <div className="text-center p-4 bg-purple-400/10 rounded-xl mb-4">
            <span className="text-purple-400 text-xl font-bold">{friendCode}</span>
          </div>
        ) : (
          <button 
            onClick={handleGenerateCode}
            className="w-full p-4 mb-4 border-2 border-purple-400 text-purple-400 rounded-xl hover:bg-purple-400/10"
          >
            Generate Code
          </button>
        )}
        
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Enter friend code"
            maxLength={6}
            className="w-full p-4 border-2 border-yellow-400 text-yellow-400 rounded-xl bg-transparent focus:outline-none"
          />
          
          <button 
            onClick={handleRedeemCode}
            disabled={isRedeeming || !inputCode}
            className="w-full p-4 border-2 border-yellow-400 text-yellow-400 rounded-xl hover:bg-yellow-400/10 disabled:opacity-50"
          >
            {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`text-center mt-4 ${
          message.includes('Error') || message.includes('Invalid') 
            ? 'text-red-400' 
            : 'text-green-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;