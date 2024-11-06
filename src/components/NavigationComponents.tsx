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
    <nav className="w-full h-16 bg-black bg-opacity-40 backdrop-blur-md border-t border-white border-opacity-5">
      <div className="h-full max-w-lg mx-auto flex justify-between items-center px-6">
        <button 
          onClick={() => onNavigate('main')}
          className={`flex flex-col items-center transition-all duration-300 ${
            currentPage === 'main' 
              ? 'text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L3 9v11a2 2 0 002 2h14a2 2 0 002-2V9l-9-7z" />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-xs">Game</span>
            <span className="text-[10px] opacity-60">Play Now</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('friends')}
          className={`flex flex-col items-center transition-all duration-300 ${
            currentPage === 'friends' 
              ? 'text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-xs">Friends</span>
            <span className="text-[10px] opacity-60">Leaderboard</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('account')}
          className={`flex flex-col items-center transition-all duration-300 ${
            currentPage === 'account' 
              ? 'text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-xs">Profile</span>
            <span className="text-[10px] opacity-60">Statistics</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('tasks')}
          className={`flex flex-col items-center transition-all duration-300 ${
            currentPage === 'tasks' 
              ? 'text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-xs">Tasks</span>
            <span className="text-[10px] opacity-60">Daily Goals</span>
          </div>
        </button>
      </div>
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