import React, { useState, useEffect } from 'react';
import "./App.scss";
import styled from "styled-components";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import LandingPage from "./LandingPage";
import { trackUserVisit, type VisitStats } from './userTracking';
import { NavigationBar, FriendsPage, AccountPage, TasksPage } from './components/NavigationComponents';
import { TelegramUser, NavigationPage } from './types';

const StyledApp = styled.div`
  max-width: 100vw;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;

  /* Create space for the navigation bar */
  .content-container {
    flex: 1;
    margin-bottom: 64px; /* This should match the navigation bar height */
    position: relative;
    z-index: 1;
  }

  /* Background animation container */
  .bg-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  /* Navigation bar container */
  .navigation-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000; /* Ensure it's above other content */
    background: black;
  }
`;

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
            const visitStats = await trackUserVisit(
              user.id.toString(),
              user.first_name
            );
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
    <StyledApp>
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>

      <div className="content-container">
        {renderCurrentPage()}
      </div>

      {!showLanding && (
        <div className="navigation-container">
          <NavigationBar 
            currentPage={currentPage}
            onNavigate={setCurrentPage}
          />
        </div>
      )}
    </StyledApp>
  );
}

export default App;