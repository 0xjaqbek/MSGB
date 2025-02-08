import React from 'react';
import styled from 'styled-components';

interface StartAdventureButtonProps {
  onClick: () => void;
}

const StyledButton = styled.button`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
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

const StartAdventureButton: React.FC<StartAdventureButtonProps> = ({ onClick }) => {
    return (
      <StyledButton 
        onClick={onClick} 
        aria-label="Start Adventure"
      >
        <span>START</span>
        <span>ADVENTURE</span>
      </StyledButton>
    );
  };

export default StartAdventureButton;