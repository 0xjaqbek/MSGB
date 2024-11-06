import React, { useState, useEffect } from 'react';
import "./App.scss";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import LandingPage from "./LandingPage";
import { trackUserVisit, type VisitStats } from './userTracking';
import { NavigationBar, FriendsPage, AccountPage, TasksPage } from './components/NavigationComponents';
import { TelegramUser, NavigationPage } from './types';

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userStats, setUserStats] = useState<VisitStats | null>(null);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('main');

  useEffect(() => {
    const initializeApp = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          setTelegramUser(user as TelegramUser);
          try {
            const visitStats = await trackUserVisit(user.id.toString(), user.first_name);
            setUserStats(visitStats);
          } catch (error) {
            console.error('Error tracking user visit:', error);
          }
        }
      }
    };

    initializeApp();
  }, []);

  const handleStart = async () => {
    if (userStats?.isFirstVisit && telegramUser) {
      try {
        const updatedStats = await trackUserVisit(
          telegramUser.id.toString(),
          telegramUser.first_name
        );
        setUserStats(updatedStats);
      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    }
    setShowLanding(false);
  };

  // Show navigation bar only when not on landing page AND not on main game page
  const shouldShowNavigation = !showLanding && currentPage !== 'main';

  const renderCurrentPage = () => {
    if (showLanding) {
      return (
        <LandingPage 
          telegramUser={telegramUser}
          onStart={handleStart}
          userStats={userStats}
        />
      );
    }

    switch (currentPage) {
      case 'main':
        return <Content />;
      case 'friends':
        return <FriendsPage telegramUser={telegramUser} />;
      case 'account':
        return <AccountPage telegramUser={telegramUser} userStats={userStats} />;
      case 'tasks':
        return <TasksPage />;
      default:
        return <Content />;
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>

      {renderCurrentPage()}

      {shouldShowNavigation && (
        <NavigationBar 
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}
    </div>
  );
}
export default App;