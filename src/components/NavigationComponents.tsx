// components/NavigationComponents.tsx
import React from 'react';
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
      bottom: '1%',
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '2px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      background: 'transparent'
    }}>
      <button 
        onClick={() => onNavigate('main')}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '2px',
          cursor: 'pointer'
        }}
      >
        <img 
          src={currentPage === 'main' ? mainActive : mainDefault} 
          alt="Main"
          style={{ width: '13vh', height: '13vh' }}
        />
      </button>

      <button 
        onClick={() => onNavigate('friends')}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '2px',
          cursor: 'pointer'
        }}
      >
        <img 
          src={currentPage === 'friends' ? friendsActive : friendsDefault} 
          alt="Friends"
          style={{ width: '13vh', height: '13vh' }}
        />
      </button>

      <button 
        onClick={() => onNavigate('account')}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '2px',
          cursor: 'pointer'
        }}
      >
        <img 
          src={currentPage === 'account' ? accountActive : accountDefault} 
          alt="Account"
          style={{ width: '13vh', height: '13vh' }}
        />
      </button>

      <button 
        onClick={() => onNavigate('tasks')}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '2px',
          cursor: 'pointer'
        }}
      >
        <img 
          src={currentPage === 'tasks' ? tasksActive : tasksDefault} 
          alt="Tasks"
          style={{ width: '13vh', height: '13vh' }}
        />
      </button>
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
  if (!telegramUser) {
    return <div className="page-container">
      <span className="text-glow animate-pulse">Loading...</span>
    </div>;
  }

  return (
    <div className="page-container">
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