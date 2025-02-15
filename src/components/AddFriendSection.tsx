import React, { useState } from 'react';
import styled from 'styled-components';
import ramkaZ from '../assets/ramkaZ.svg';
import { FriendRequest } from '../types';

const RamkaContainer = styled.div`
  background-image: url(${ramkaZ});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #0FF;
  text-align: center;
  position: relative;
  box-sizing: border-box;
`;

const InfoText = styled.p`
  color: white;
  margin-bottom: 8px;
  font-family: 'REM', sans-serif;
  line-height: 1.2;
  width: 100%;
`;

const InputContainer = styled.div`
  position: relative;
  width: min(80%, 280px);
  margin: 12px 12px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
`;

const StyledInput = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.31);
  border-radius: 24px;
  padding: 10px 16px;
  padding-right: 85px;
  color: #0FF;
  width: 100%;
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

const AddButton = styled.button<{ $variant?: 'accept' | 'reject' | 'send' }>`
  margin: 0;
  padding: 6px 12px;
  height: calc(100% - 8px);
  background: transparent;
  border: 1px solid ${props => 
    props.$variant === 'accept' ? 'rgba(0, 255, 0, 0.5)' :
    props.$variant === 'reject' ? 'rgba(255, 0, 0, 0.5)' :
    'rgba(255, 255, 255, 0.3)'
  };
  color: ${props => 
    props.$variant === 'accept' ? '#0F0' :
    props.$variant === 'reject' ? '#F00' :
    '#FFF'
  };
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

const RequestContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
`;

const RequestInfo = styled.div`
  color: white;
  font-family: 'REM', sans-serif;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const TabContainer = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 10px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  color: ${props => props.$active ? '#0FF' : 'rgba(255,255,255,0.5)'};
  border-bottom: 2px solid ${props => props.$active ? '#0FF' : 'transparent'};
  font-family: 'REM', sans-serif;
  transition: all 0.3s ease;
`;

interface AddFriendSectionProps {
  pendingRequests?: FriendRequest[];
  sentRequests?: FriendRequest[];
  onSendRequest?: (friendId: string) => Promise<void>;
  onAcceptRequest?: (userId: string, action: 'accept' | 'reject') => void;
  onRejectRequest?: (userId: string, action: 'accept' | 'reject') => void;
  isProcessing?: boolean;
  error?: string;
}

export const AddFriendSection: React.FC<AddFriendSectionProps> = ({
  pendingRequests = [],
  sentRequests = [],
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  isProcessing = false,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'receive' | 'send'>('receive');
  const [friendId, setFriendId] = useState('');

  const handleSubmit = async () => {
    if (!friendId.trim() || isProcessing) return;
    await onSendRequest?.(friendId);
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

      <TabContainer>
        <Tab 
          $active={activeTab === 'receive'}
          onClick={() => setActiveTab('receive')}
        >
          Receive
        </Tab>
        <Tab 
          $active={activeTab === 'send'}
          onClick={() => setActiveTab('send')}
        >
          Send
        </Tab>
      </TabContainer>

      {activeTab === 'receive' ? (
        pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <RequestContainer key={request.fromUserId}>
              <RequestInfo>
                {request.fromUserName} wants to be your friend
              </RequestInfo>
              <ButtonGroup>
                <AddButton 
                    $variant="accept"
                    onClick={() => onAcceptRequest?.(request.fromUserId, 'accept')}
                >
                    Accept
                </AddButton>
                <AddButton 
                    $variant="reject"
                    onClick={() => onRejectRequest?.(request.fromUserId, 'reject')}
                >
                    Reject
                </AddButton>
                </ButtonGroup>
            </RequestContainer>
          ))
        ) : (
          <InfoText style={{ color: 'rgba(255,255,255,0.7)' }}>
            No pending friend requests
          </InfoText>
        )
      ) : (
        <>
          <InputContainer>
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

          {sentRequests.length > 0 && (
            <>
              {sentRequests.map((request) => (
                <RequestContainer key={request.fromUserId}>
                  <RequestInfo>
                    Request sent to {request.fromUserName}
                  </RequestInfo>
                  <ButtonGroup>
                    <AddButton $variant="reject">
                      Cancel
                    </AddButton>
                  </ButtonGroup>
                </RequestContainer>
              ))}
            </>
          )}
        </>
      )}
    </RamkaContainer>
  );
};