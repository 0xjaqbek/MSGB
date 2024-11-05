import React, { useState, useEffect } from 'react';
import "./App.scss";
import styled from "styled-components";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content, { trackUserVisit } from "./Content";
import LandingPage from "./LandingPage";

// Type definitions
type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

const StyledApp = styled.div`
  max-width: 100vw;
  min-height: 100vh;
`;

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userStats, setUserStats] = useState<{
    currentStreak: number;
    highestStreak: number;
    visits: number;
  } | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          setTelegramUser(user as TelegramUser);
          
          try {
            // Track the visit
            const visitStats = await trackUserVisit(
              user.id.toString(),
              user.first_name
            );
            
            setUserStats({
              currentStreak: visitStats.currentStreak,
              highestStreak: visitStats.highestStreak,
              visits: visitStats.visits
            });
          } catch (error) {
            console.error('Error tracking user visit:', error);
          }
        }
      }
    };

    initializeApp();
  }, []);

  const handleStart = () => {
    setShowLanding(false);
  };

  return (
    <StyledApp>
      {/* Background animation */}
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>

      {/* Landing page with streak information */}
      {showLanding && (
        <LandingPage 
          telegramUser={telegramUser}
          onStart={handleStart}
          userStats={userStats} // Pass stats to landing page
        />
      )}

      {/* Main content */}
      {!showLanding && <Content />}
    </StyledApp>
  );
}

export default App;