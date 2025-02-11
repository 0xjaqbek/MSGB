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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!telegramUser) return;

    const fetchInitialData = async () => {
      try {
        const db = getDatabase();
        
        // Fetch friend count
        const friendsRef = ref(db, `users/${telegramUser.id}/friends`);
        const snapshot = await get(friendsRef);
        if (snapshot.exists()) {
          setFriendCount(Object.keys(snapshot.val()).length);
        }

        // Check for existing code
        const allCodesRef = ref(db, 'friendCodes');
        const codesSnapshot = await get(allCodesRef);
        if (codesSnapshot.exists()) {
          const allCodes = codesSnapshot.val();
          for (const [code, data] of Object.entries(allCodes)) {
            if (typeof data === 'object' && data !== null && 'userId' in data) {
              if (data.userId === telegramUser.id) {
                setFriendCode(code);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [telegramUser]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, info]);
  };

  const handleInvite = () => {
    if (!telegramUser) {
      setMessage('Error: Not authorized');
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

  const handleGenerateCode = async () => {
    setDebugInfo([]); // Clear previous debug info
    setIsGenerating(true);
    
    if (!telegramUser) {
        addDebugInfo('❌ Error: No telegram user found');
        setMessage('Error: Not authorized');
        setIsGenerating(false);
        return;
    }
    
    try {
        // First check database access
        const db = getDatabase();
        addDebugInfo('🔒 Testing database access...');
        
        // Test write permission in user's own path first
        try {
            const testRef = ref(db, `users/${telegramUser.id.toString()}/test`);
            await set(testRef, {
                timestamp: Date.now()
            });
            await set(testRef, null); // Clean up test data
            addDebugInfo('✅ Database access confirmed');
        } catch (error) {
            addDebugInfo('❌ Database access denied');
            addDebugInfo('🔑 Please make sure you are authorized');
            setMessage('Database access denied. Please try again later.');
            setIsGenerating(false);
            return;
        }

        addDebugInfo('👤 Checking user: ' + telegramUser.id.toString());
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        addDebugInfo('🎲 Generated code: ' + code);
        
        addDebugInfo('📚 Connected to database');

        // Check for existing codes
        addDebugInfo('🔍 Checking existing codes...');
        try {
            const allCodesRef = ref(db, 'friendCodes');
            const allCodesSnapshot = await get(allCodesRef);
            
            if (allCodesSnapshot.exists()) {
                addDebugInfo('📝 Found existing codes list');
                const allCodes = allCodesSnapshot.val();
                for (const [existingCode, data] of Object.entries(allCodes)) {
                    if (typeof data === 'object' && data !== null && 'userId' in data) {
                        if (data.userId === telegramUser.id.toString()) {
                            addDebugInfo('✨ Found your existing code: ' + existingCode);
                            setFriendCode(existingCode as string);
                            setMessage('Your existing code was found');
                            setIsGenerating(false);
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            addDebugInfo('❌ Error checking existing codes');
            addDebugInfo('⚠️ Proceeding with new code generation');
        }
        
        addDebugInfo('🆕 Creating new code...');
        
        try {
            // Try to write directly to user's path first
            const userCodeRef = ref(db, `users/${telegramUser.id.toString()}/friendCode`);
            await set(userCodeRef, {
                code: code,
                createdAt: Date.now()
            });
            
            // Then try to write to friendCodes
            const codeRef = ref(db, `friendCodes/${code}`);
            const codeData = {
                userId: telegramUser.id.toString(),
                userName: telegramUser.first_name,
                createdAt: Date.now(),
                status: 'active'
            };
            
            addDebugInfo('💾 Saving new code...');
            await set(codeRef, codeData);
            
            addDebugInfo('✅ Code saved successfully!');
            setFriendCode(code);
            setMessage('New code generated successfully!');
            
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('permission_denied')) {
                    addDebugInfo('❌ Permission denied saving code');
                    addDebugInfo('🔑 Please contact support');
                } else {
                    addDebugInfo(`❌ Error: ${error.message}`);
                }
            }
            setMessage('Error saving code. Please try again later.');
            return;
        }

    } catch (error) {
        addDebugInfo('❌ Error occurred:');
        if (error instanceof Error) {
            if (error.message.includes('permission_denied')) {
                addDebugInfo('🔒 Database access denied');
                addDebugInfo('🔑 Please make sure you are authorized');
            } else {
                addDebugInfo(`🔴 ${error.message}`);
            }
        } else {
            addDebugInfo('🔴 Unknown error occurred');
        }
        setMessage('Error generating code. Please try again.');
    } finally {
        setIsGenerating(false);
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
      const referrerRef = ref(db, `users/${codeData.userId}/invitedFriends`);
      const referrerSnapshot = await get(referrerRef);
      const currentCount = referrerSnapshot.exists() ? referrerSnapshot.val() : 0;
      await set(referrerRef, currentCount + 1);
      
      // Give bonus tickets to both users
      const updateUserTickets = async (userId: string, amount: number) => {
        const userVisitsRef = ref(db, `users/${userId}/visits`);
        const visitsSnapshot = await get(userVisitsRef);
        if (visitsSnapshot.exists()) {
          const visits = visitsSnapshot.val();
          await set(userVisitsRef, {
            ...visits,
            maxPlaysToday: (visits.maxPlaysToday || 5) + amount,
            playsRemaining: (visits.playsRemaining || 0) + amount
          });
        }
      };

      await updateUserTickets(telegramUser.id.toString(), 2); // New friend gets 2 tickets
      await updateUserTickets(codeData.userId, 1); // Code owner gets 1 ticket
      
      // Remove used code
      await set(codeRef, null);
      
      setMessage('Friend added successfully! +2 tickets');
      setInputCode('');
      setFriendCount(prev => prev + 1);
      
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
            disabled={isGenerating}
            className="w-full p-4 mb-4 border-2 border-purple-400 text-purple-400 rounded-xl hover:bg-purple-400/10 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
        )}

        {debugInfo.length > 0 && (
          <div className="mt-4 p-3 bg-black/30 rounded-xl text-sm">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-cyan-400 mb-1">
                {info}
              </div>
            ))}
          </div>
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