// components/NavigationComponents.tsx
import React from 'react';
import { Home, Users, User, CheckSquare } from 'lucide-react';
import { TelegramUser, NavigationPage } from '../types';
import { VisitStats } from '../userTracking';

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
      bottom: '5%',  // Position above Telegram button
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '8px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      background: 'transparent'
    }}>
      <button 
        onClick={() => onNavigate('main')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: currentPage === 'main' ? '#fff' : 'rgba(255,255,255,0.7)',
          padding: '8px',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '24px' }}>🎮</span>
        <span style={{ fontSize: '12px', marginTop: '4px' }}>Main</span>
      </button>

      <button 
        onClick={() => onNavigate('friends')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: currentPage === 'friends' ? '#fff' : 'rgba(255,255,255,0.7)',
          padding: '8px',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '24px' }}>👥</span>
        <span style={{ fontSize: '12px', marginTop: '4px' }}>Friends</span>
      </button>

      <button 
        onClick={() => onNavigate('account')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: currentPage === 'account' ? '#fff' : 'rgba(255,255,255,0.7)',
          padding: '8px',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '24px' }}>👤</span>
        <span style={{ fontSize: '12px', marginTop: '4px' }}>Account</span>
      </button>

      <button 
        onClick={() => onNavigate('tasks')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: currentPage === 'tasks' ? '#fff' : 'rgba(255,255,255,0.7)',
          padding: '8px',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '24px' }}>📋</span>
        <span style={{ fontSize: '12px', marginTop: '4px' }}>Tasks</span>
      </button>
    </div>
  );
};

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  return (
    <div className="min-h-screen bg-black/50 p-4 text-white flex flex-col items-center max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">Friends</h1>
      <div className="space-y-4 w-full">
        <div className="bg-blue-950/40 rounded-lg p-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <h2 className="text-xl mb-2 text-blue-300">Welcome, {telegramUser?.first_name}</h2>
          <h3 className="text-xl mb-2 text-blue-400">Leaderboard</h3>
          <p className="text-blue-200/60">Coming soon...</p>
        </div>
        
        <div className="bg-blue-950/40 rounded-lg p-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <h2 className="text-xl mb-2 text-blue-300">Friend Requests</h2>
          <p className="text-blue-200/60">No pending requests</p>
        </div>
      </div>
    </div>
  );
};

const AccountPage: React.FC<AccountPageProps> = ({ telegramUser, userStats }) => {
  if (!telegramUser) {
    return <div className="min-h-screen bg-black/50 p-4 text-white flex justify-center">
      <span className="text-blue-400 animate-pulse">Loading...</span>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black/50 p-4 text-white flex flex-col items-center max-w-2xl mx-auto">
      <div className="w-full bg-blue-950/40 rounded-lg p-6 mb-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        <h1 className="text-2xl font-bold mb-4 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">My Account</h1>
        <div className="space-y-3">
          <p className="flex justify-between items-center p-2 rounded bg-blue-900/20">
            <span className="text-blue-200">Name:</span>
            <span className="text-white">{telegramUser.first_name}</span>
          </p>
          {userStats && (
            <>
              <p className="flex justify-between items-center p-2 rounded bg-blue-900/20">
                <span className="text-blue-200">Current Streak:</span>
                <span className="text-white">{userStats.currentStreak} days</span>
              </p>
              <p className="flex justify-between items-center p-2 rounded bg-blue-900/20">
                <span className="text-blue-200">Highest Streak:</span>
                <span className="text-white">{userStats.highestStreak} days</span>
              </p>
              <p className="flex justify-between items-center p-2 rounded bg-blue-900/20">
                <span className="text-blue-200">Total Visits:</span>
                <span className="text-white">{userStats.totalVisits}</span>
              </p>
              <p className="flex justify-between items-center p-2 rounded bg-blue-900/20">
                <span className="text-blue-200">Today's Plays:</span>
                <span className="text-white">{userStats.playsToday} / {userStats.maxPlaysToday}</span>
              </p>
            </>
          )}
        </div>
      </div>
      
      <div className="w-full bg-blue-950/40 rounded-lg p-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        <h2 className="text-xl font-bold mb-4 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">Statistics</h2>
        <p className="text-blue-200/60">More stats coming soon...</p>
      </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black/50 p-4 text-white flex flex-col items-center max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">Daily Tasks</h1>
      <div className="space-y-4 w-full">
        <div className="bg-blue-950/40 rounded-lg p-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <h2 className="text-xl mb-4 text-blue-300">Today's Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-blue-500/20 rounded bg-blue-900/20">
              <span className="text-white">Play 5 games</span>
              <span className="text-blue-400 font-medium">0/5</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-blue-500/20 rounded bg-blue-900/20">
              <span className="text-white">Score 50 points</span>
              <span className="text-blue-400 font-medium">0/50</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-blue-500/20 rounded bg-blue-900/20">
              <span className="text-white">Visit the app</span>
              <span className="text-green-400">✓</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-950/40 rounded-lg p-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <h2 className="text-xl mb-2 text-blue-300">Weekly Challenges</h2>
          <p className="text-blue-200/60">Coming soon...</p>
        </div>
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