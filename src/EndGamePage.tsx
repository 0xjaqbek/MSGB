import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import hero from '../src/assets/hero.png';
import welcomeBox from '../src/assets/welcomeBox.svg';
import { get, getDatabase, ref } from 'firebase/database';

interface EndGamePageProps {
  reason: 'no-plays' | 'game-over';
  score?: number;
  nextPlayTime?: string;
  playsFromStreak?: number;
  onShare?: () => void;
  onClose?: () => void;
  onPlayAgain?: () => void;
  ticketsLeft: number;
  onNavigateToFriends?: () => void;
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

const BaseButton = styled.button`
  position: relative;
  margin-top: 30px;
  background: transparent;
  padding: 12px 32px;
  border-radius: 12px;
  z-index: 50;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  font-family: 'REM', monospace;

  span {
    font-size: 22px;
    font-weight: bold;
    line-height: 1.4;
    letter-spacing: 1px;
  }
`;

const PlayAgainButton = styled(BaseButton)`
  border: 2px solid #0FF;
  color: #0FF;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);

  &:hover {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    transform: scale(1.05);
  }
`;

const InviteButton = styled(BaseButton)`
  border: 2px solid #FFD700;
  color: #FFD700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);

  &:hover {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    transform: scale(1.05);
  }
`;

const LoginText = styled.p`
  color: white;
  margin-top: 10px;
  font-family: 'REM', sans-serif;
  font-size: 1rem;
`;

const EndGamePage: React.FC<EndGamePageProps> = ({ 
  reason, 
  score,
  onPlayAgain,
  onNavigateToFriends
}) => {
  const [remainingTickets, setRemainingTickets] = useState(0);

  useEffect(() => {
    const fetchRemainingTickets = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg?.initDataUnsafe?.user?.id) return;

        const userId = tg.initDataUnsafe.user.id;
        const db = getDatabase();
        const playsRef = ref(db, `users/${userId}/plays/remaining`);
        const snapshot = await get(playsRef);
        const tickets = snapshot.val() || 0;
        setRemainingTickets(tickets);
      } catch (error) {
        console.error('Error fetching remaining tickets:', error);
        setRemainingTickets(0);
      }
    };

    fetchRemainingTickets();
  }, []);

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
                YOU HAVE <span className="highlight">{remainingTickets}</span>
                {remainingTickets === 1 ? ' TICKET' : ' TICKETS'} LEFT!
              </div>
            </>
          )}
        </BoxContent>
      </BoxContainer>

      {remainingTickets > 0 ? (
        <PlayAgainButton onClick={onPlayAgain}>
          <span>PLAY AGAIN</span>
        </PlayAgainButton>
      ) : (
        <>
          <InviteButton onClick={onNavigateToFriends}>
            <span>INVITE A FREN</span>
          </InviteButton>
          <LoginText>OR LOGIN TOMORROW</LoginText>
        </>
      )}
    </Container>
  );
};

export default EndGamePage;