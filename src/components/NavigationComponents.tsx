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
    <nav className="w-full h-16 bg-black bg-opacity-90 backdrop-blur-md border-t border-gray-800 flex justify-around items-center">
      <button 
        onClick={() => onNavigate('main')}
        className={`flex flex-col items-center justify-center w-1/4 h-full transition-all duration-200 ${
          currentPage === 'main' 
            ? 'text-blue-400 scale-110' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Home size={24} className="mb-1" />
        <span className="text-xs font-medium">Main</span>
      </button>
      
      <button 
        onClick={() => onNavigate('friends')}
        className={`flex flex-col items-center justify-center w-1/4 h-full transition-all duration-200 ${
          currentPage === 'friends' 
            ? 'text-blue-400 scale-110' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Users size={24} className="mb-1" />
        <span className="text-xs font-medium">Friends</span>
      </button>
      
      <button 
        onClick={() => onNavigate('account')}
        className={`flex flex-col items-center justify-center w-1/4 h-full transition-all duration-200 ${
          currentPage === 'account' 
            ? 'text-blue-400 scale-110' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <User size={24} className="mb-1" />
        <span className="text-xs font-medium">Account</span>
      </button>
      
      <button 
        onClick={() => onNavigate('tasks')}
        className={`flex flex-col items-center justify-center w-1/4 h-full transition-all duration-200 ${
          currentPage === 'tasks' 
            ? 'text-blue-400 scale-110' 
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <CheckSquare size={24} className="mb-1" />
        <span className="text-xs font-medium">Tasks</span>
      </button>
    </nav>
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