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
    <nav className="w-full h-16 bg-black bg-opacity-80 backdrop-blur-lg border-t border-opacity-20 border-blue-400">
      <div className="w-full h-full max-w-screen-xl mx-auto flex justify-around items-center">
        <button 
          onClick={() => onNavigate('main')}
          className={`group flex flex-col items-center justify-center w-1/4 h-full relative
            ${currentPage === 'main' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <div className={`absolute top-0 w-full h-0.5 bg-blue-400 transform scale-x-0 transition-transform duration-300
            ${currentPage === 'main' ? 'scale-x-100' : 'group-hover:scale-x-50'}`} />
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 mb-1 transition-transform duration-300 group-hover:scale-110"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12 3L4 9v12h16V9l-8-6z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3v6m0 0l4-3m-4 3l-4-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-light tracking-wider">MAIN</span>
        </button>

        <button 
          onClick={() => onNavigate('friends')}
          className={`group flex flex-col items-center justify-center w-1/4 h-full relative
            ${currentPage === 'friends' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <div className={`absolute top-0 w-full h-0.5 bg-blue-400 transform scale-x-0 transition-transform duration-300
            ${currentPage === 'friends' ? 'scale-x-100' : 'group-hover:scale-x-50'}`} />
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 mb-1 transition-transform duration-300 group-hover:scale-110"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM19 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            <path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            <path d="M5 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            <path d="M19 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            <path d="M12 8v4M5 8v4M19 8v4" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-light tracking-wider">FRIENDS</span>
        </button>

        <button 
          onClick={() => onNavigate('account')}
          className={`group flex flex-col items-center justify-center w-1/4 h-full relative
            ${currentPage === 'account' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <div className={`absolute top-0 w-full h-0.5 bg-blue-400 transform scale-x-0 transition-transform duration-300
            ${currentPage === 'account' ? 'scale-x-100' : 'group-hover:scale-x-50'}`} />
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 mb-1 transition-transform duration-300 group-hover:scale-110"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="5" />
            <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
            <path d="M12 8v4m0 0l-2-2m2 2l2-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-light tracking-wider">ACCOUNT</span>
        </button>

        <button 
          onClick={() => onNavigate('tasks')}
          className={`group flex flex-col items-center justify-center w-1/4 h-full relative
            ${currentPage === 'tasks' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          <div className={`absolute top-0 w-full h-0.5 bg-blue-400 transform scale-x-0 transition-transform duration-300
            ${currentPage === 'tasks' ? 'scale-x-100' : 'group-hover:scale-x-50'}`} />
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 mb-1 transition-transform duration-300 group-hover:scale-110"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            <path d="M9 6l3 3 3-3M9 18l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-light tracking-wider">TASKS</span>
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