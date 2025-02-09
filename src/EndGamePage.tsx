import React from 'react';
import styled from 'styled-components';
import hero from '../src/assets/hero.png';
import welcomeBox from '../src/assets/welcomeBox.svg';

interface EndGamePageProps {
  reason: 'no-plays' | 'game-over';
  score?: number;
  nextPlayTime?: string;
  playsFromStreak?: number;
  onShare?: () => void;
  onClose?: () => void;
  onPlayAgain?: () => void;
  ticketsLeft: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  position: absolute;
  top: 15%;  // Changed to match WelcomeSection
  left: 50%;
  transform: translateX(-50%);
`;

const HeroImage = styled.img`
  width: 65vw;
  height: auto;
  margin-bottom: -10px;
`;

const BoxContainer = styled.div`
  position: relative;
  width: 80vw;
  z-index: 2; // Higher z-index to stay on top
`;

const BoxImage = styled.img`
  width: 100%;
  height: auto;
`;

const BoxContent = styled.div`
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: 'REM', sans-serif;
  line-height: 1.5;
  width: 100%;
  padding: 0 1rem;

  .text {
    color: white;
    margin-bottom: 0.5rem;
  }

  .highlight {
    color: #FFD700;
  }
`;

const PlayAgainButton = styled.button`
  position: relative;
  margin-top: 30px;
  background: transparent;
  border: 2px solid #0FF;
  color: #0FF;
  padding: 12px 32px;
  border-radius: 12px;
  z-index: 50;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  font-family: 'REM', monospace;

  &:hover {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    transform: translateX(-50%) scale(1.05);
  }

  span {
    font-size: 22px;
    font-weight: bold;
    line-height: 1.4;
    letter-spacing: 1px;
  }
`;

const EndGamePage: React.FC<EndGamePageProps> = ({ 
  reason, 
  score,
  ticketsLeft,
  onPlayAgain
}) => {
  return (
    <Container>
      <HeroImage src={hero} alt="Hero" />
      <BoxContainer>
        <BoxImage src={welcomeBox} alt="Welcome Box" />
        <BoxContent>
          <div className="text">GAME OVER</div>
          {reason === 'no-plays' ? (
            <div className="text">NO TICKETS LEFT!</div>
          ) : (
            <>
              {score !== undefined && (
                <div className="text">
                  FINAL SCORE: <span className="highlight">{score}</span>
                </div>
              )}
              <div className="text">
                YOU HAVE <span className="highlight">{ticketsLeft}</span>
                {ticketsLeft === 1 ? ' TICKET' : ' TICKETS'} LEFT!
              </div>
            </>
          )}
        </BoxContent>
      </BoxContainer>

      {ticketsLeft > 0 && onPlayAgain && (
        <PlayAgainButton onClick={onPlayAgain}>
          <span>PLAY AGAIN</span>
        </PlayAgainButton>
      )}
    </Container>
  );
};

export default EndGamePage;