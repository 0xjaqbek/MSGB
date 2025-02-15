import React, { useState } from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.31);
  border-radius: 24px;
  padding: 10px 16px;
  padding-right: 85px;
  color: #0FF;
  width: 80%;
  font-family: 'REM', sans-serif;
  font-size: 0.9rem;
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
  height: 100%;
`;

const AddButton = styled.button`
  margin: 5px;
  padding: 6px 12px;
  height: calc(100% - 8px);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #FFF;
  border-radius: 20px;
  white-space: nowrap;
  font-family: 'REM', sans-serif;
  transition: all 0.3s ease;
  font-size: 0.85rem;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InputContainer = styled.div`
  position: relative;
  width: min(85%, 280px);
  margin: 8px auto;
  display: flex;
  align-items: center;
  box-sizing: border-box;
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

interface AddFriendProps {
  onSendRequest: (friendId: string) => Promise<void>;
  isProcessing: boolean;
  error?: string;
}

export const AddFriend: React.FC<AddFriendProps> = ({
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
  );
};