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
import { get, getDatabase, ref } from 'firebase/database';

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
      bottom: '10px', 
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '2px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      background: 'transparent',
      maxWidth: '100vw', 
      overflow: 'hidden',
      height: '64px' 
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
            width: '13vh',
            height: '13vh',
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

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  return (
    <div className="page-container">
      <h1 className="text-glow text-xl mb-4">Friends</h1>
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Welcome, {telegramUser?.first_name}</h2>
        <h3 className="text-glow text-lg mb-2">Leaderboard</h3>
        <p className="text-info">Coming soon...</p>
      </div>
      
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Friend Requests</h2>
        <p className="text-info">No pending requests</p>
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
      <div className="card">
        <h1 className="text-glow text-xl mb-4">My Account</h1>
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
    <div className="page-container">
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