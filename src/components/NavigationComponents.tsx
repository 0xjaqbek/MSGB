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
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-gray-800 flex justify-around items-center z-50">
      <button 
        onClick={() => onNavigate('main')}
        className={`flex flex-col items-center ${currentPage === 'main' ? 'text-blue-400' : 'text-gray-400'}`}
      >
        <Home size={24} />
        <span className="text-xs mt-1">Main</span>
      </button>
      
      <button 
        onClick={() => onNavigate('friends')}
        className={`flex flex-col items-center ${currentPage === 'friends' ? 'text-blue-400' : 'text-gray-400'}`}
      >
        <Users size={24} />
        <span className="text-xs mt-1">Friends</span>
      </button>
      
      <button 
        onClick={() => onNavigate('account')}
        className={`flex flex-col items-center ${currentPage === 'account' ? 'text-blue-400' : 'text-gray-400'}`}
      >
        <User size={24} />
        <span className="text-xs mt-1">Account</span>
      </button>
      
      <button 
        onClick={() => onNavigate('tasks')}
        className={`flex flex-col items-center ${currentPage === 'tasks' ? 'text-blue-400' : 'text-gray-400'}`}
      >
        <CheckSquare size={24} />
        <span className="text-xs mt-1">Tasks</span>
      </button>
    </div>
  );
};

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-xl mb-2">Welcome, {telegramUser?.first_name}</h2>
          <h3 className="text-xl mb-2">Leaderboard</h3>
          <p className="text-gray-400">Coming soon...</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-xl mb-2">Friend Requests</h2>
          <p className="text-gray-400">No pending requests</p>
        </div>
      </div>
    </div>
  );
};

const AccountPage: React.FC<AccountPageProps> = ({ telegramUser, userStats }) => {
  if (!telegramUser) {
    return <div className="min-h-screen bg-black p-4 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <div className="bg-gray-900 rounded-lg p-6 mb-4">
        <h1 className="text-2xl font-bold mb-4">My Account</h1>
        <div className="space-y-2">
          <p className="flex justify-between">
            <span className="text-gray-400">Name:</span>
            <span>{telegramUser.first_name}</span>
          </p>
          {userStats && (
            <>
              <p className="flex justify-between">
                <span className="text-gray-400">Current Streak:</span>
                <span>{userStats.currentStreak} days</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Highest Streak:</span>
                <span>{userStats.highestStreak} days</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Total Visits:</span>
                <span>{userStats.totalVisits}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Today's Plays:</span>
                <span>{userStats.playsToday} / {userStats.maxPlaysToday}</span>
              </p>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Statistics</h2>
        <p className="text-gray-400">More stats coming soon...</p>
      </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Daily Tasks</h1>
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Today's Tasks</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border border-gray-800 rounded">
              <span>Play 5 games</span>
              <span className="text-blue-400">0/5</span>
            </div>
            <div className="flex items-center justify-between p-2 border border-gray-800 rounded">
              <span>Score 50 points</span>
              <span className="text-blue-400">0/50</span>
            </div>
            <div className="flex items-center justify-between p-2 border border-gray-800 rounded">
              <span>Visit the app</span>
              <span className="text-green-400">✓</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Weekly Challenges</h2>
          <p className="text-gray-400">Coming soon...</p>
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