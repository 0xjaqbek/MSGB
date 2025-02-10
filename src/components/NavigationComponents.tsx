// components/NavigationComponents.tsx
import React, { useEffect, useState } from 'react';
import { Home, Users, User, CheckSquare } from 'lucide-react';
import { TelegramUser, NavigationPage } from '../types';
import { VisitStats } from '../userTracking';
import mainActive from '../assets/mainA.svg';
import mainDefault from '../assets/mainD.svg';
import friendsActive from '../assets/friendsA.svg';
import friendsDefault from '../assets/friendsD.svg';
import accountActive from '../assets/accountA.svg';
import accountDefault from '../assets/accountD.svg';
import tasksActive from '../assets/taskasA.svg';
import tasksDefault from '../assets/tasksD.svg';
import { get, getDatabase, ref, set } from 'firebase/database';
import hudBackground from '../assets/HUDbottom.svg';

interface NavigationBarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

interface FriendsPageProps {
  telegramUser: TelegramUser | null;
}

interface AccountPageProps {
  telegramUser: TelegramUser | null;
  userStats: VisitStats | null;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentPage, onNavigate }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '0', 
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start',  // Changed from center to flex-start
      background: `url(${hudBackground}) no-repeat center bottom`,
      backgroundSize: '100% 100%',
      maxWidth: '100vw', 
      overflow: 'hidden',
      // height: '100px',
      padding: '15px 10px 0'  // Added top padding to push icons down
    }}>
      {[
        { page: 'main', activeImg: mainActive, defaultImg: mainDefault },
        { page: 'friends', activeImg: friendsActive, defaultImg: friendsDefault },
        { page: 'account', activeImg: accountActive, defaultImg: accountDefault },
        { page: 'tasks', activeImg: tasksActive, defaultImg: tasksDefault }
      ].map(({ page, activeImg, defaultImg }) => (
        <button 
          key={page}
          onClick={() => onNavigate(page as NavigationPage)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            marginTop: '5px',  // Added margin top to push down icons
            width: '10vh',
            height: '10vh',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <img 
            src={currentPage === page ? activeImg : defaultImg} 
            alt={page}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </button>
      ))}
    </div>
  );
};

export default NavigationBar;

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  const [friendCode, setFriendCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [friendCount, setFriendCount] = useState<number>(0);

  useEffect(() => {
    if (!telegramUser) return;
    
    const db = getDatabase();
    const friendsRef = ref(db, `users/${telegramUser.id}/friends`);
    
    get(friendsRef).then((snapshot) => {
      if (snapshot.exists()) {
        setFriendCount(Object.keys(snapshot.val()).length);
      }
    });
  }, [telegramUser]);

  const handleGenerateCode = async () => {
    if (!telegramUser) return;
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const db = getDatabase();
    await set(ref(db, `friendCodes/${code}`), {
      userId: telegramUser.id,
      createdAt: Date.now()
    });
    
    setFriendCode(code);
  };

  const handleInvite = () => {
    if (!telegramUser) return;
    const inviteLink = `https://t.me/moonstonesgamebot?start=invite_${telegramUser.id}`;
    window.Telegram?.WebApp?.sendData(JSON.stringify({ 
      action: 'share_invite',
      link: inviteLink
    }));
  };

  const handleRedeemCode = async () => {
    if (!telegramUser || !inputCode) return;
    
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
      setMessage('Error redeeming code');
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
          className="w-full p-4 mb-4 border-2 border-purple-400 text-purple-400 rounded-xl hover:bg-purple-400/10"
        >
          Generate Code
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
            className="w-full p-4 border-2 border-yellow-400 text-yellow-400 rounded-xl hover:bg-yellow-400/10"
          >
            Redeem Code
          </button>
          
          {message && (
            <div className={`text-center ${message.includes('Error') || message.includes('Invalid') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AccountPage: React.FC<AccountPageProps> = ({ telegramUser, userStats }) => {
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    const fetchTotalPoints = async () => {
      if (telegramUser) {
        try {
          const db = getDatabase();
          const playerScoresRef = ref(db, `/${telegramUser.id}/scores`);
          const snapshot = await get(playerScoresRef);
          
          if (snapshot.exists()) {
            const scores = snapshot.val();
            const total = Object.values(scores).reduce((sum: number, entry: any) => {
              return sum + (entry.score || 0);
            }, 0);
            setTotalPoints(total);
          }
        } catch (error) {
          console.error('Error fetching total points:', error);
        }
      }
    };

    fetchTotalPoints();
  }, [telegramUser]);

  if (!telegramUser) {
    return <div className="page-container">
      <span className="text-glow animate-pulse">Loading...</span>
    </div>;
  }

  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <h1 className="text-glow text-xl mb-4">My Account</h1>
      <div className="card">
        
        <div className="space-y-2">
          <div className="stat-row">
            <span className="text-info">Name:</span>
            <span className="text-value">{telegramUser.first_name}</span>
          </div>
          {userStats && (
            <>
              <div className="stat-row">
                <span className="text-info">Current Streak:</span>
                <span className="text-value">{userStats.currentStreak} days</span>
              </div>
              <div className="stat-row">
                <span className="text-info">Highest Streak:</span>
                <span className="text-value">{userStats.highestStreak} days</span>
              </div>
              <div className="stat-row">
                <span className="text-info">Total Visits:</span>
                <span className="text-value">{userStats.totalVisits}</span>
              </div>
              <div className="stat-row">
                <span className="text-info">Today's Plays:</span>
                <span className="text-value">{userStats.playsToday} / {userStats.maxPlaysToday}</span>
              </div>
              <div className="stat-row">
                <span className="text-info">Total Points:</span>
                <span className="text-value">{totalPoints}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Statistics</h2>
        <p className="text-info">More stats coming soon...</p>
      </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <h1 className="text-glow text-xl mb-4">Daily Tasks</h1>
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Today's Tasks</h2>
        <div className="space-y-2">
          <div className="stat-row">
            <span>Play 5 games</span>
            <span className="text-glow">0/5</span>
          </div>
          <div className="stat-row">
            <span>Score 50 points</span>
            <span className="text-glow">0/50</span>
          </div>
          <div className="stat-row">
            <span>Visit the app</span>
            <span className="text-green-400">✓</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Weekly Challenges</h2>
        <p className="text-info">Coming soon...</p>
      </div>
    </div>
  );
};

export {
  NavigationBar,
  FriendsPage,
  AccountPage,
  TasksPage
};