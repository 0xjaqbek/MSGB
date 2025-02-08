import React, { useState, useEffect } from 'react';
import "./App.scss";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import LandingPage from "./LandingPage";
import { trackUserVisit, updatePlayCount, type VisitStats } from './userTracking';
import { NavigationBar, FriendsPage, AccountPage, TasksPage } from './components/NavigationComponents';
import { TelegramUser, NavigationPage } from './types';

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userStats, setUserStats] = useState<VisitStats | null>(null);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('main');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        tg.requestFullscreen();
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
    setCurrentPage('main');
  };
  
  const handleGameStateChange = (isGamePlaying: boolean) => {
    setIsPlaying(isGamePlaying);
  };

  const handleDirectGameStart = async () => {
    if (telegramUser) {
      try {
        const remainingPlays = await updatePlayCount(telegramUser.id.toString());
        
        if (remainingPlays < 0) {
          // Handle no plays scenario
          return;
        }

        setShowLanding(false);
        const event = new CustomEvent('start-game');
        setTimeout(() => {
          window.dispatchEvent(event);
        }, 100);
      } catch (error) {
        console.error('Error updating play count:', error);
      }
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Background container */}
      <div className={`background-container ${isPlaying ? 'game-bg' : 'main-bg'}`} />

      {renderCurrentPage()}

      {/* Show navigation bar only when not playing and not on landing */}
      {!showLanding && !isPlaying && (
        <NavigationBar 
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}
    </div>
  );

  function renderCurrentPage() {
    console.log("renderCurrentPage called, showLanding:", showLanding);
    if (showLanding) {
      return (
      <LandingPage 
        telegramUser={telegramUser}
        onStart={handleStart}
        onDirectStart={handleDirectGameStart} // Add this
        userStats={userStats}
      />
      );
    }
  
    console.log("currentPage:", currentPage);
    switch (currentPage) {
      case 'main':
        return <Content onGameStateChange={handleGameStateChange} />;
      case 'friends':
        return <FriendsPage telegramUser={telegramUser} />;
      case 'account':
        return <AccountPage telegramUser={telegramUser} userStats={userStats} />;
      case 'tasks':
        return <TasksPage />;
      default:
        return <Content onGameStateChange={handleGameStateChange} />;
    }
  }
}

export default App;