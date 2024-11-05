import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { TelegramUser } from './types';

interface LandingPageProps {
  telegramUser: TelegramUser | null;
  onStart: () => void;
  userStats: {
    currentStreak: number;
    highestStreak: number;
    visits: number;
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
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0);
  z-index: 1000;
  transition: opacity 0.5s ease-in-out;
  opacity: ${props => props.$show ? 1 : 0};
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
`;

const WelcomeText = styled.div`
  color: #fff;
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  animation: ${fadeIn} 1s ease-out, ${float} 6s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);

  span {
    display: block;
    font-size: 3.5rem;
    color: #88c8ff;
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

const StatsContainer = styled.div`
  color: #88c8ff;
  font-size: 1.2rem;
  margin-top: 1rem;
  text-align: center;
  animation: ${fadeIn} 1s ease-out 0.7s backwards;
`;

const StartButton = styled.button`
  background: transparent;
  border: 2px solid #88c8ff;
  color: #88c8ff;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${fadeIn} 1s ease-out 0.5s backwards;
  margin-top: 2rem;

  &:hover {
    background: #88c8ff;
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(136, 200, 255, 0.5);
  }
`;

const LandingPage: React.FC<LandingPageProps> = ({ telegramUser, onStart, userStats }) => {
  const [show, setShow] = useState(true);
  const isFirstVisit = userStats?.visits === 1;

  const handleStart = () => {
    setShow(false);
    setTimeout(() => {
      onStart();
    }, 500);
  };

  return (
    <StyledLanding $show={show}>
      {isFirstVisit ? (
        // First Visit Content
        <>
          <WelcomeText>
            Welcome to
            <span>MoonStones</span>
            {telegramUser && (
              <div style={{ fontSize: '1.8rem', marginTop: '1rem' }}>
                {telegramUser.first_name}
              </div>
            )}
          </WelcomeText>
          
          <FirstVisitInfo>
            <div>🎮 Visit daily to build your <span className="highlight">streak</span></div>
            <div>⚡ Each day you play adds to your streak</div>
            <div>❌ Miss a day and streak resets</div>
            <div>🏆 Compete for the highest streak!</div>
          </FirstVisitInfo>
        </>
      ) : (
        // Returning User Content
        <>
          <WelcomeText>
            Welcome back to
            <span>MoonStones</span>
            {telegramUser && (
              <div style={{ fontSize: '1.8rem', marginTop: '1rem' }}>
                {telegramUser.first_name}
              </div>
            )}
          </WelcomeText>
          
          {userStats && (
            <StatsContainer>
              <div>🔥 Current Streak: {userStats.currentStreak} days</div>
              <div>⭐ Highest Streak: {userStats.highestStreak} days</div>
              <div>🎮 Total Visits: {userStats.visits}</div>
            </StatsContainer>
          )}
        </>
      )}
      
      <StartButton onClick={handleStart}>
        {isFirstVisit ? 'Begin Journey' : 'Continue Journey'}
      </StartButton>
    </StyledLanding>
  );
};

export default LandingPage;