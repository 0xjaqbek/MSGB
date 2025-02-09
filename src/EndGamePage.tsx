import React from 'react';
import styled, { keyframes } from 'styled-components';
import hero from '../src/assets/hero.png';
import welcomeBox from '../src/assets/welcomeBox.svg';

interface EndGamePageProps {
  reason: 'no-plays' | 'game-over';
  score?: number;
  nextPlayTime?: string;
  playsFromStreak?: number;
  onShare?: () => void;
  onClose?: () => void;
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

const StyledEndGame = styled.div`
  position: fixed;
  top: 100px; // Adjusted like in LandingPage
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
  opacity: 1;
  pointer-events: auto;
`;

const HeroContainer = styled.div`
  margin-top: 30px;
  margin-bottom: -20px; // Added negative margin for overlap
  height: 60%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  z-index: 1; // Lower z-index so it goes under the box
`;

const HeroImage = styled.img`
  width: 65vw;
  height: auto;
`;

const BoxContainer = styled.div`
  width: 80vw;
  z-index: 2;
`;

const BoxImage = styled.img`
  width: 100%;
  height: auto;
`;

const BoxContent = styled.div`

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: 'REM', sans-serif;
  line-height: 1.5;
  width: 100%;
  padding: 0 1rem;

  .text {
    color: white;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .highlight {
    color: #FFD700;
  }
`;

const EndGamePage: React.FC<EndGamePageProps> = ({ 
  reason, 
  score, 
  playsFromStreak = 0
}) => {
  return (
    <StyledEndGame>
      <HeroContainer>
        <HeroImage src={hero} alt="Hero" />
      </HeroContainer>

      <BoxContainer>
        <BoxImage src={welcomeBox} alt="Welcome Box" />
        <BoxContent>
          <div className="text">GAME OVER</div>
          {reason === 'no-plays' ? (
            <div className="text">NO TICKETS LEFT!</div>
          ) : (
            <>
              <div className="text">
                YOU HAVE <span className="highlight">{playsFromStreak}</span>
                {playsFromStreak === 1 ? ' TICKET' : ' TICKETS'} LEFT!
              </div>
              {score !== undefined && (
                <div className="text">
                  FINAL SCORE: <span className="highlight">{score}</span>
                </div>
              )}
            </>
          )}
        </BoxContent>
      </BoxContainer>
    </StyledEndGame>
  );
};

export default EndGamePage;