import React, { useState, useEffect } from 'react';
import "./App.scss";
import styled from "styled-components";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import LandingPage from "./LandingPage";
import { trackUserVisit, type VisitStats } from './userTracking';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface UserStats {
  currentStreak: number;
  highestStreak: number;
  totalVisits: number;
  todayVisits: number;
  isFirstVisit: boolean;
}

const StyledApp = styled.div`
  max-width: 100vw;
  min-height: 100vh;
`;

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

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
            const visitStats = await trackUserVisit(
              user.id.toString(),
              user.first_name
            );
            
            setUserStats({
              currentStreak: visitStats.currentStreak,
              highestStreak: visitStats.highestStreak,
              totalVisits: visitStats.totalVisits,
              todayVisits: visitStats.todayVisits,
              isFirstVisit: visitStats.isFirstVisit
            });
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
      const updatedStats = await trackUserVisit(
        telegramUser.id.toString(),
        telegramUser.first_name
      );
      
      setUserStats({
        currentStreak: updatedStats.currentStreak,
        highestStreak: updatedStats.highestStreak,
        totalVisits: updatedStats.totalVisits,
        todayVisits: updatedStats.todayVisits,
        isFirstVisit: false
      });
    }
    setShowLanding(false);
  };

  return (
    <StyledApp>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>

      {showLanding && (
        <LandingPage 
          telegramUser={telegramUser}
          onStart={handleStart}
          userStats={userStats}
        />
      )}

      {!showLanding && <Content />}
    </StyledApp>
  );
}

export default App;