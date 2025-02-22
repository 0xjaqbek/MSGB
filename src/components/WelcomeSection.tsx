import React from 'react';
import styled from 'styled-components';
import hero from '../assets/hero.png';
import welcomeBox from '../assets/welcomeBox.svg';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  position: absolute;
  top: 5%;
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
  }

  .highlight {
    color: #FFD700;
  }
`;

interface WelcomeSectionProps {
  userName: string;
  ticketsLeft: number;
  isFirstVisit?: boolean;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName, ticketsLeft, isFirstVisit }) => {
  return (
    <Container>
      <HeroImage src={hero} alt="Hero" />
      <BoxContainer>
        <BoxImage src={welcomeBox} alt="Welcome Box" />
        <BoxContent>
          {isFirstVisit ? (
            <>
              <div className="text">Play daily to grow your <span className="highlight">streak</span>.</div>
              <div className="text">Miss a day, and it resets.</div>
              <div className="text">More streak = more points!</div>
            </>
          ) : (
            <>
              <div className="text">Hello {userName}</div>
              <div className="text">You got <span className="highlight">{ticketsLeft} tickets</span></div>
              <div className="text">
                {ticketsLeft > 0 ? (
                  "Use them wisely."
                ) : (
                  <>
                    Invite a Friend<br/>
                    or get back Tomorrow.
                  </>
                )}
              </div>
            </>
          )}
        </BoxContent>
      </BoxContainer>
    </Container>
  );
};

export default WelcomeSection;