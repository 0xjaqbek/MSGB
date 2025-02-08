import React from 'react';
import styled, { keyframes } from 'styled-components';

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

const StyledEndGame = styled.div`
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
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${fadeIn} 1s ease-out;
`;

const BoxContainer = styled.div`
  position: relative;
  width: 80vw;
`;

const BoxImage = styled.div`
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(136, 200, 255, 0.2);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 0 15px rgba(136, 200, 255, 0.2);
  backdrop-filter: blur(5px);
`;

const BoxContent = styled.div`
  text-align: center;
  font-family: 'REM', sans-serif;
  line-height: 1.5;
  width: 100%;
  padding: 1rem;

  .title {
    color: #FFD700;
    font-size: 2rem;
    margin-bottom: 1rem;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }

  .text {
    color: white;
    font-size: 1.2rem;
  }

  .highlight {
    color: #0FF;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
`;

const EndGamePage: React.FC<EndGamePageProps> = ({ 
  reason, 
  score, 
  nextPlayTime = "tomorrow",
  playsFromStreak = 0,
  onShare,
  onClose 
}) => {
  return (
    <StyledEndGame>
      <Container>
        <BoxContainer>
          <BoxImage>
            <BoxContent>
              <div className="title">GAME OVER</div>
              <div className="text">
                {reason === 'no-plays' ? (
                  'NO TICKETS LEFT!'
                ) : (
                  <>
                    YOU HAVE <span className="highlight">{playsFromStreak}</span>
                    {playsFromStreak === 1 ? ' TICKET' : ' TICKETS'} LEFT!
                  </>
                )}
              </div>
              {score !== undefined && (
                <div className="text" style={{ marginTop: '1rem' }}>
                  FINAL SCORE: <span className="highlight">{score}</span>
                </div>
              )}
            </BoxContent>
          </BoxImage>
        </BoxContainer>
      </Container>
    </StyledEndGame>
  );
};

export default EndGamePage;