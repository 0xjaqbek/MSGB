import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { TelegramUser } from './types';
import WelcomeSection from './components/WelcomeSection';

interface LandingPageProps {
  telegramUser: TelegramUser | null;
  onStart: () => void;
  onDirectStart: () => void; // Add this
  userStats: {
    currentStreak: number;
    highestStreak: number;
    totalVisits: number;
    todayVisits: number;
    isFirstVisit: boolean;
    playsRemaining: number;
  } | null;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const StyledLanding = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 100px;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background: rgba(0, 0, 0, 0);
  z-index: 1000;
  transition: opacity 0.5s ease-in-out;
  opacity: ${props => props.$show ? 1 : 0};
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
`;

const HeroContainer = styled.div`
  margin-top: 30px; 
  margin-bottom: -10px;
  height: 60%; // Slightly reduced height to accommodate the streak message
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const WelcomeContainer = styled.div`
  top: 30px;
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative; // Added to handle z-index properly
  z-index: 2; // Higher z-index to ensure it stays on top
`;

const ButtonContainer = styled.div`
  position: fixed; 
  bottom: 60px;       
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 10px;
`;
const WelcomeText = styled.div`
  color: #fff;
  font-size: 2.5rem;
  text-align: center;
  animation: ${fadeIn} 1s ease-out, ${float} 6s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);

  span {
    display: block;
    font-size: 3.5rem;
    color: #0FF;
    margin: 1rem 0;
  }
`;

const FirstVisitInfo = styled.div`
  color: #fff;
  font-size: 1.2rem;
  text-align: center;
  max-width: 80%;
  margin: 1rem auto;
  animation: ${fadeIn} 1s ease-out 0.3s backwards;
  line-height: 1.5;

  .highlight {
    color: #88c8ff;
    font-weight: bold;
  }
`;

const StartButton = styled.button`
  width: 80%;
  background: transparent;
  border: 2px solid #9D4EDD; 
  color: #9D4EDD; 
  padding: 1rem 2rem;
  font-size: 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #9D4EDD; 
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(157, 78, 221, 0.5); 
  }
`;

const StartPlayingButton = styled(StartButton)`
  background: transparent;
  color: #0FF; 
  border: 2px solid #0FF; 

  &:hover {
    background: #0FF; 
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); // Cyan glow
  }
`;

const StreakMessage = styled.div`
  color: #FFD700;
  font-size: 1.2rem;
  text-align: center;
  margin-top: -10px; // Added negative margin to move it up
  animation: ${fadeIn} 1s ease-out;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  z-index: 2; // Higher z-index to ensure it stays on top
`;

const getOrdinalSuffix = (number: number): string => {
  const j = number % 10;
  const k = number % 100;
  if (j === 1 && k !== 11) return number + "st";
  if (j === 2 && k !== 12) return number + "nd";
  if (j === 3 && k !== 13) return number + "rd";
  return number + "th";
};

const LandingPage: React.FC<LandingPageProps> = ({ telegramUser, onStart, onDirectStart, userStats }) => {
  const [show, setShow] = useState(true);
  const isFirstVisit = userStats?.isFirstVisit;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes();
      tg.setHeaderColor("#000000");
      tg.setBottomBarColor("#000000");
    }
  }, []);

  const handleGoToMainPage = () => {
    setShow(false);
    setTimeout(() => {
      onStart();
    }, 500);
  };

  const handleStartPlaying = () => {
    setShow(false);
    setTimeout(() => {
      if (userStats?.playsRemaining === 0) {
        onStart(); // Use the same function as GO TO MAIN PAGE
      } else {
        onDirectStart(); // Original function for starting the game
      }
    }, 500);
  };

  return (
    <StyledLanding $show={show}>
      {!isFirstVisit && userStats && userStats.currentStreak > 0 && (
        <StreakMessage>
          It's your {getOrdinalSuffix(userStats.currentStreak)} day straight!
        </StreakMessage>
      )}
      <HeroContainer>
        {isFirstVisit ? (
          <WelcomeText>
            Welcome to
            <span>MoonStones</span>
            {telegramUser && (
              <div style={{ fontSize: '1.8rem', marginTop: '1rem' }}>
                {telegramUser.first_name}
              </div>
            )}
          </WelcomeText>
        ) : null}
      </HeroContainer>

      <WelcomeContainer>
        {isFirstVisit ? (
          <FirstVisitInfo>
            <div>🎮 Visit daily to build your <span className="highlight">streak</span></div>
            <div>⚡ Each day you play adds to your streak</div>
            <div>❌ Miss a day and streak resets</div>
            <div>🏆 Compete for the highest streak!</div>
          </FirstVisitInfo>
        ) : (
          <>
            {telegramUser && userStats && (
              <WelcomeSection 
                userName={telegramUser.first_name}
                ticketsLeft={userStats.playsRemaining}
              />
            )}
          </>
        )}
      </WelcomeContainer>

      <ButtonContainer>
        <StartPlayingButton onClick={handleStartPlaying}>
          {userStats?.playsRemaining === 0 ? 'NO TICKETS LEFT' : 'START PLAYING'}
        </StartPlayingButton>
        
        <StartButton onClick={handleGoToMainPage}>
          {isFirstVisit ? 'GO TO MAIN PAGE' : 'GO TO MAIN PAGE'}
        </StartButton>
      </ButtonContainer>
    </StyledLanding>
  );
};

export default LandingPage;