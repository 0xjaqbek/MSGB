import React from 'react';
import styled from 'styled-components';
import hero from '../assets/hero.svg';
import welcomeBox from '../assets/welcomeBox.svg';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
`;

const HeroImage = styled.img`
  width: 45vw;
  height: auto;
  margin-bottom: 1rem;
`;

const BoxContainer = styled.div`
  position: relative;
  width: 80vw;
`;

const BoxImage = styled.img`
  width: 100%;
  height: auto;
`;

const BoxContent = styled.div`
  position: absolute;
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
  }

  .highlight {
    color: #FFD700;
  }
`;

interface WelcomeSectionProps {
  userName: string;
  ticketsLeft: number;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName, ticketsLeft }) => {
  return (
    <Container>
      <HeroImage src={hero} alt="Hero" />
      <BoxContainer>
        <BoxImage src={welcomeBox} alt="Welcome Box" />
        <BoxContent>
          <div className="text">Hello {userName}</div>
          <div className="text">You got <span className="highlight">{ticketsLeft} tickets</span></div>
          <div className="text">Use them wisely.</div>
        </BoxContent>
      </BoxContainer>
    </Container>
  );
};

export default WelcomeSection;