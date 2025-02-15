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
  font-size: 16px; // Changed to 16px to prevent iOS zoom
  box-sizing: border-box;
  -webkit-appearance: none; // iOS fix
  appearance: none;
  outline: none;

  // iOS specific fixes
  @supports (-webkit-touch-callout: none) {
    font-size: 16px;
    line-height: normal;
  }

  &::placeholder {
    color: rgba(0, 255, 255, 0.5);
    opacity: 1; // iOS fix
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    -webkit-text-fill-color: #0FF; // iOS fix
  }
`;

const ButtonWrapper = styled.div`
  position: absolute;
  right: 4px;
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-tap-highlight-color: transparent; // iOS fix
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
  -webkit-appearance: none; // iOS fix
  appearance: none;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // iOS specific tap state
  @supports (-webkit-touch-callout: none) {
    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const InputContainer = styled.div`
  position: relative;
  width: min(85%, 280px);
  margin: 8px 8px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent; // iOS fix
`;

const Form = styled.form`
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  justify-content: center;
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!friendId.trim() || isProcessing) return;
    await onSendRequest(friendId);
    setFriendId('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputContainer>
        {error && (
          <ErrorMessage $isSuccess={error.includes('sent')}>
            {error}
          </ErrorMessage>
        )}
        <StyledInput
          type="text"
          inputMode="numeric"
          placeholder="Enter User ID"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          disabled={isProcessing}
        />
        <ButtonWrapper>
          <AddButton
            type="submit"
            disabled={isProcessing || !friendId.trim()}
          >
            Add Friend
          </AddButton>
        </ButtonWrapper>
      </InputContainer>
    </Form>
  );
};