// src/components/AddFriendSection.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import ramka from '../assets/ramka.svg';

// Styled components...
const RamkaContainer = styled.div`
  background-image: url(${ramka});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  padding: 8px 8px;
  margin-top: 5px;
  width: 90%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #0FF;
  text-align: center;
  position: relative;
`;

const InfoText = styled.p`
  color: white;
  margin-bottom: 8px;
  font-family: 'REM', sans-serif;
  line-height: 0.9;
`;

const InputContainer = styled.div`
  position: relative;
  width: 85%;
  margin: 16px auto;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.31);
  border-radius: 24px;
  padding: 12px 16px;
  padding-right: 90px;
  color: #0FF;
  width: 100%;
  font-family: 'REM', sans-serif;
  font-size: 1rem;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(0, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonWrapper = styled.div`
  position: absolute;
  right: 4px;
  display: flex;
  align-items: center;
`;

const AddButton = styled.button`
  margin: 0;
  padding: 8px 16px;
  height: calc(100% - 8px);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #FFF;
  border-radius: 20px;
  white-space: nowrap;
  font-family: 'REM', sans-serif;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div<{ $isSuccess?: boolean }>`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  color: ${props => props.$isSuccess ? '#0FF' : '#FF4444'};
  font-size: 0.9rem;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  font-family: 'REM', sans-serif;
`;

interface AddFriendSectionProps {
  onSendRequest: (friendId: string) => Promise<void>;
  isProcessing: boolean;
  error?: string;
}

export const AddFriendSection: React.FC<AddFriendSectionProps> = ({
  onSendRequest,
  isProcessing,
  error
}) => {
  const [friendId, setFriendId] = useState('');

  const handleSubmit = async () => {
    if (!friendId.trim() || isProcessing) return;
    await onSendRequest(friendId);
    setFriendId('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <RamkaContainer>
      <InfoText>
        Get extra ticket<br/>
        for every 2 friends added
      </InfoText>
      <InputContainer>
        {error && (
          <ErrorMessage $isSuccess={error.includes('sent')}>
            {error}
          </ErrorMessage>
        )}
        <StyledInput
          type="text"
          placeholder="Enter User ID"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          disabled={isProcessing}
          onKeyPress={handleKeyPress}
        />
        <ButtonWrapper>
          <AddButton
            onClick={handleSubmit}
            disabled={isProcessing || !friendId.trim()}
          >
            Add Friend
          </AddButton>
        </ButtonWrapper>
      </InputContainer>
    </RamkaContainer>
  );
};