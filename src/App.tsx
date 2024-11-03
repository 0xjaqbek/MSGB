import React, { useState, useEffect } from 'react';
import "./App.scss";
import styled from "styled-components";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
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

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user as TelegramUser);
      }
    }
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

      {/* Landing page */}
      {showLanding && (
        <LandingPage 
          telegramUser={telegramUser} 
          onStart={handleStart}
        />
      )}

      {/* Main content */}
      {!showLanding && <Content />}
    </StyledApp>
  );
}

export default App;