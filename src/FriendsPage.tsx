import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { TelegramUser } from '../src/types';

interface FriendsPageProps {
  telegramUser: TelegramUser | null;
}

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  const [friendCode, setFriendCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState('');
  const [friendCount, setFriendCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!telegramUser) return;
    
    const fetchFriendCount = async () => {
      const db = getDatabase();
      const friendsRef = ref(db, `users/${telegramUser.id}/friends`);
      
      try {
        const snapshot = await get(friendsRef);
        if (snapshot.exists()) {
          setFriendCount(Object.keys(snapshot.val()).length);
        }
      } catch (error) {
        console.error('Error fetching friend count:', error);
      }
    };

    fetchFriendCount();
  }, [telegramUser]);

  const handleGenerateCode = async () => {
    if (!telegramUser || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const db = getDatabase();
      await set(ref(db, `friendCodes/${code}`), {
        userId: telegramUser.id,
        createdAt: Date.now()
      });
      
      setFriendCode(code);
      setMessage('Code generated successfully!');
    } catch (error) {
      console.error('Error generating code:', error);
      setMessage('Error generating code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInvite = () => {
    if (!telegramUser) return;
    const inviteLink = `https://t.me/moonstonesgamebot?start=invite_${telegramUser.id}`;
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.sendData(JSON.stringify({ 
        action: 'share_invite',
        link: inviteLink
      }));
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
        <button 
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="w-full p-4 mb-4 border-2 border-purple-400 text-purple-400 rounded-xl hover:bg-purple-400/10 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Code'}
        </button>
        
        {friendCode && (
          <div className="text-center p-4 bg-purple-400/10 rounded-xl mb-4">
            <span className="text-purple-400 text-xl font-bold">{friendCode}</span>
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
          
          {message && (
            <div className={`text-center ${
              message.includes('Error') || message.includes('Invalid') 
                ? 'text-red-400' 
                : 'text-green-400'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;