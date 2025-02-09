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
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  position: absolute;
  top: 20%;
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
  z-index: 2;
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

const EndGamePage: React.FC<EndGamePageProps> = ({ 
  reason, 
  score, 
  playsFromStreak = 0
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
    </Container>
  );
};

export default EndGamePage;