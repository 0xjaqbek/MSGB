import React from 'react';
import styled from 'styled-components';
import hero from '../src/assets/hero.svg';
import welcomeBox from '../src/assets/welcomeBox.svg';

const WelcomeContainer = styled.div`
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
`;

const HeroImage = styled.img`
  width: 90vw;
  margin-bottom: 1rem;
`;

const WelcomeBoxContainer = styled.div`
  position: relative;
  width: 90vw;
`;

const WelcomeBoxImage = styled.img`
  width: 100%;
`;

const WelcomeText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
  padding: 0 1rem;
  color: white;
  font-family: 'REM', sans-serif;

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
    <WelcomeContainer>
      <HeroImage src={hero} alt="Hero" />
      <WelcomeBoxContainer>
        <WelcomeBoxImage src={welcomeBox} alt="Welcome Box" />
        <WelcomeText>
          <div>Hello {userName}</div>
          <div>You got <span className="highlight">{ticketsLeft} tickets</span></div>
          <div>Use them wisely.</div>
        </WelcomeText>
      </WelcomeBoxContainer>
    </WelcomeContainer>
  );
};

export default WelcomeSection;