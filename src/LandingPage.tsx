import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { TelegramUser } from './types';
import WelcomeSection from './components/WelcomeSection';

interface LandingPageProps {
  telegramUser: TelegramUser | null;
  onStart: () => void;
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
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0);
  z-index: 1000;
  padding: 5% 0;
  transition: opacity 0.5s ease-in-out;
  opacity: ${props => props.$show ? 1 : 0};
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
`;

const HeroContainer = styled.div`
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const WelcomeContainer = styled.div`
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const ButtonContainer = styled.div`
  height: 30%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 15px;
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
  border: 2px solid #0FF;
  color: #0FF;
  padding: 1rem 2rem;
  font-size: 1rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #0FF;
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(136, 200, 255, 0.5);
  }
`;

const StartPlayingButton = styled(StartButton)`
  background: #0FF;
  color: #000;
  border: none;

  &:hover {
    background: #0FF;
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }
`;

const LandingPage: React.FC<LandingPageProps> = ({ telegramUser, onStart, userStats }) => {
  const [show, setShow] = useState(true);
  const isFirstVisit = userStats?.isFirstVisit;

  const handleGoToMainPage = () => {
    setShow(false);
    setTimeout(() => {
      onStart();
    }, 500);
  };

  const handleStartPlaying = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user?.id) return;
  
    setShow(false);
    
    // Directly dispatch a custom event for game start
    window.dispatchEvent(new CustomEvent('start-game'));
  };

  return (
    <StyledLanding $show={show}>
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
          START PLAYING
        </StartPlayingButton>
        
        <StartButton onClick={handleGoToMainPage}>
          {isFirstVisit ? 'GO TO MAIN PAGE' : 'GO TO MAIN PAGE'}
        </StartButton>
      </ButtonContainer>
    </StyledLanding>
  );
};

export default LandingPage;