import React, { useState, useEffect } from 'react';
import "./App.scss";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import LandingPage from "./LandingPage";
import { trackUserVisit, updatePlayCount, type VisitStats } from './userTracking';
import { NavigationBar, AccountPage, TasksPage } from './components/NavigationComponents';
import FriendsPage from './FriendsPage';
import { TelegramUser, NavigationPage } from './types';
import { get, getDatabase, ref, set } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Define WelcomeBonus component outside of the main App component
const WelcomeBonus: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #0FF',
      borderRadius: '15px',
      padding: '20px',
      textAlign: 'center',
      color: '#0FF',
      zIndex: 1000
    }}>
      <h2 style={{ marginBottom: '1rem' }}>🎉 Welcome Bonus! 🎉</h2>
      <p style={{ marginBottom: '1.5rem' }}>
        You received 2 bonus tickets for joining through an invite!
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: '2px solid #0FF',
          color: '#0FF',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Start Playing
      </button>
    </div>
  );
};

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userStats, setUserStats] = useState<VisitStats | null>(null);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobileTelegram, setIsMobileTelegram] = useState(true);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  //  // Fallback component for non-mobile environments
  //  const MobileAppFallback = () => (
  //    <div style={{
  //      display: 'flex',
  //      flexDirection: 'column',
  //      justifyContent: 'center',
  //      alignItems: 'center',
  //      height: '100vh',
  //      padding: '20px',
  //      textAlign: 'center',
  //      backgroundColor: '#000',
  //      color: '#0FF',
  //      fontFamily: 'REM, sans-serif'
  //    }}>
  //      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>MoonStones</h1>
  //      <p style={{ marginBottom: '10px' }}>This app is only available in the Telegram mobile app.</p>
  //      <p style={{ marginBottom: '20px' }}>Please open this link in the Telegram mobile app.</p>
  //      <div style={{ 
  //        marginTop: '20px', 
  //        border: '2px solid #0FF', 
  //        padding: '10px'
  //      }}>
  //        <a 
  //          href="https://t.me/moonstonesgamebot" 
  //          style={{ 
  //            color: '#0FF', 
  //            textDecoration: 'none',
  //            fontSize: '1.2rem'
  //          }}
  //        >
  //          Open in Telegram
  //        </a>
  //      </div>
  //    </div>
  //  );

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const auth = getAuth();
        await signInAnonymously(auth);
        console.log('Anonymous authentication successful');
      } catch (error) {
        console.error('Anonymous authentication error', error);
      }
    };
  
    initializeFirebase();
  }, []); 

  useEffect(() => {
    const initializeApp = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        if (!tg.isOrientationLocked) {
          tg.lockOrientation();
        }
        
        // Detect mobile environment
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobileTelegram(isMobile);

        (tg as any).requestFullscreen?.();
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          setTelegramUser(user as TelegramUser);
          try {
            const visitStats = await trackUserVisit(user.id.toString(), user.first_name);
            setUserStats(visitStats);

            // Check for referral after user is initialized
            if (tg.initDataUnsafe?.start_param?.startsWith('invite_')) {
              const referrerId = tg.initDataUnsafe.start_param.replace('invite_', '');
              
              // Check if this user already was referred (to prevent duplicate bonuses)
              const db = getDatabase();
              const userRef = ref(db, `users/${user.id}/referredBy`);
              const snapshot = await get(userRef);

              if (!snapshot.exists()) {
                // Handle new referral
                try {
                  // Record referral relationship
                  await set(ref(db, `users/${user.id}/referredBy`), {
                    userId: referrerId,
                    timestamp: Date.now()
                  });

                  // Add to referrer's invited list
                  await set(ref(db, `users/${referrerId}/invited/${user.id}`), {
                    timestamp: Date.now()
                  });

                  // Update referrer's invited friends count
                  const referrerRef = ref(db, `users/${referrerId}/invitedFriends`);
                  const referrerSnapshot = await get(referrerRef);
                  const currentCount = referrerSnapshot.exists() ? referrerSnapshot.val() : 0;
                  await set(referrerRef, currentCount + 1);

                  // Add bonus tickets to both users
                  const updateVisitStats = async (userId: string, bonusTickets: number) => {
                    const visitsRef = ref(db, `users/${userId}/visits`);
                    const visitsSnapshot = await get(visitsRef);
                    if (visitsSnapshot.exists()) {
                      const visits = visitsSnapshot.val();
                      await set(visitsRef, {
                        ...visits,
                        maxPlaysToday: (visits.maxPlaysToday || 5) + bonusTickets,
                        playsRemaining: (visits.playsRemaining || 0) + bonusTickets
                      });
                    }
                  };

                  await updateVisitStats(user.id.toString(), 2); // 2 bonus tickets for new user
                  await updateVisitStats(referrerId, 1); // 1 bonus ticket for referrer

                  // Fetch updated stats after adding bonus
                  const updatedStats = await trackUserVisit(user.id.toString(), user.first_name);
                  setUserStats(updatedStats);

                  // Show welcome message with bonus info
                  setShowWelcomeBonus(true);
                } catch (error) {
                  console.error('Error processing referral:', error);
                }
              }
            }
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
        />;
    }
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div className={`background-container ${isPlaying ? 'game-bg' : 'main-bg'}`} />

      {renderCurrentPage()}

      {showWelcomeBonus && (
        <WelcomeBonus onClose={() => setShowWelcomeBonus(false)} />
      )}

      {!showLanding && !isPlaying && (
        <NavigationBar 
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}
    </div>
  );
}

export default App;