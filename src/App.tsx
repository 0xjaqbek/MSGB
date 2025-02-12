import React, { useState, useEffect } from 'react';
import "./App.scss";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import LandingPage from "./LandingPage";
import { trackUserVisit, updatePlayCount, type VisitStats } from './userTracking';
import { NavigationBar, FriendsPage, AccountPage, TasksPage } from './components/NavigationComponents';
import { TelegramUser, NavigationPage } from './types';
import { processInviteLink } from './ticketManagement'; 
import { get, getDatabase, ref } from 'firebase/database';

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userStats, setUserStats] = useState<VisitStats | null>(null);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobileTelegram, setIsMobileTelegram] = useState(true);

//  // Fallback component for non-mobile environments
//  const MobileAppFallback = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#000',
      color: '#0FF',
      fontFamily: 'REM, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>MoonStones</h1>
      <p style={{ marginBottom: '10px' }}>This app is only available in the Telegram mobile app.</p>
      <p style={{ marginBottom: '20px' }}>Please open this link in the Telegram mobile app.</p>
      <div style={{ 
        marginTop: '20px', 
        border: '2px solid #0FF', 
        padding: '10px'
     //   borderRadius: '10px' 
      }}>
        <a 
          href="https://t.me/moonstonesgamebot" 
          style={{ 
            color: '#0FF', 
            textDecoration: 'none',
            fontSize: '1.2rem'
          }}
        >
          Open in Telegram
        </a>
      </div>
//    </div>
//  );

useEffect(() => {
  const initializeApp = async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      if (!tg.isOrientationLocked) {
        tg.lockOrientation();
      }
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobileTelegram(isMobile);

      (tg as any).requestFullscreen?.();
      const user = tg.initDataUnsafe?.user;
      const urlParams = new URLSearchParams(window.location.search);
      const inviteParam = urlParams.get('tgWebAppStartParam');
      
      if (user) {
        setTelegramUser(user as TelegramUser);
        try {
          // Process invite if present
          if (inviteParam?.startsWith('ref_')) {
            console.log('Processing invite:', inviteParam);
            await processInviteLink(user.id.toString(), inviteParam);
          }
          
          const visitStats = await trackUserVisit(user.id.toString(), user.first_name);
          setUserStats(visitStats);
        } catch (error) {
          console.error('Error in initialization:', error);
        }
      }
    }
  };

  initializeApp();
}, []);

const handleNavigateToFriends = () => {
  setCurrentPage('friends');
};

// Add handleGameOver function
const handleGameOver = (score: number) => {
  // If no plays remaining, navigate to friends page
  if (userStats?.playsRemaining === 0) {
    handleNavigateToFriends();
  }
};

// In App.tsx
const handleStart = async () => {
  // First update user stats if needed
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
  
  // Directly update the states without setTimeout
  setShowLanding(false);
  setCurrentPage('main');

  // Update Telegram UI if needed
  const tg = window.Telegram?.WebApp;
  if (tg?.MainButton) {
    tg.MainButton.hide();
  }
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

  // If not a mobile Telegram environment, show fallback
//  if (!isMobileTelegram) {
//    return <MobileAppFallback />;
//  }
//
return (
  <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
    <div className={`background-container ${isPlaying ? 'game-bg' : 'main-bg'}`} />
    {renderCurrentPage()}
    {!showLanding && !isPlaying && (
      <NavigationBar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
    )}
  </div>
);

  function renderCurrentPage() {
    if (showLanding) {
      return (
        <LandingPage 
          telegramUser={telegramUser}
          onStart={handleStart}
          onDirectStart={handleDirectGameStart}
          userStats={userStats}
        />
      );
    }
  
    switch (currentPage) {
      case 'main':
        return <Content 
          onGameStateChange={handleGameStateChange}
          userStats={userStats}
          onGameOver={handleGameOver} // Add this prop
          onNavigateToFriends={handleNavigateToFriends} // Add this prop
        />;
      case 'friends':
        return <FriendsPage telegramUser={telegramUser} />;
      case 'account':
        return <AccountPage telegramUser={telegramUser} userStats={userStats} />;
      case 'tasks':
        return <TasksPage />;
      default:
        return <Content 
          onGameStateChange={handleGameStateChange}
          userStats={userStats}
          onGameOver={handleGameOver} // Add this prop
          onNavigateToFriends={handleNavigateToFriends} // Add this prop
        />;
    }
  }


}

export default App;