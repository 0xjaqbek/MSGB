import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { keyframes } from 'styled-components';

// Type definitions
type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

interface LandingPageProps {
  telegramUser: TelegramUser | null;
  onStart: () => void;
}

interface StyledLandingProps {
  $show: boolean;
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
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const StyledLanding = styled.div<StyledLandingProps>`
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

  &:hover {
    background: #88c8ff;
    color: #000;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(136, 200, 255, 0.5);
  }
`;

const LandingPage: React.FC<LandingPageProps> = ({ telegramUser, onStart }) => {
  const [show, setShow] = useState(true);

  const handleStart = () => {
    setShow(false);
    setTimeout(() => {
      onStart();
    }, 500);
  };

  return (
    <StyledLanding $show={show}>
      <WelcomeText>
        Welcome back/to
        <span>MoonStones</span>
        {telegramUser && (
          <div style={{ fontSize: '1.8rem', marginTop: '1rem' }}>
            {telegramUser.first_name}
          </div>
          
        )}
        in day X 
      </WelcomeText>
      <StartButton onClick={handleStart}>
        Start Journey
      </StartButton>
    </StyledLanding>
  );
};

export default LandingPage;