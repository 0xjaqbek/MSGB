import React from 'react';
import styled from 'styled-components';
import { Friend } from '../types';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  width: 80vw;
  height: 80vh;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  padding: 30px;
  padding-top: 60px;
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid rgba(0, 255, 255, 0.3); // Cyan border
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2); // Cyan glow effect
  backdrop-filter: blur(10px); // Additional blur effect
  background: rgba(0, 0, 0, 0.7); // Slightly transparent background

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: #0FF;
  font-size: 24px;
  cursor: pointer;
  z-index: 2;
  padding: 8px;
`;

const Title = styled.h2`
  color: #0FF;
  font-size: 1.5rem;
  margin-bottom: 20px;
  text-align: center;
`;

const FriendsList = styled.div`
  width: 100%;
  padding: 0 20px;
`;

const FriendEntry = styled.div`
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  padding: 12px 0;
  margin-bottom: 8px;
  width: 100%;

  &:last-child {
    border-bottom: none;
  }
`;

const FriendInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.div`
  div:first-child {
    color: white;
  }

  div:last-child {
    font-size: 0.8rem;
    color: rgba(0, 255, 255, 0.7);
  }
`;

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  formatLastActive: (timestamp?: number) => string;
  onRemoveFriend: (friendId: string) => void;
  showConfirmRemove: string | null;
  setShowConfirmRemove: (friendId: string | null) => void;
}

const ActionButton = styled.button<{ $variant?: 'danger' | 'success' }>`
  background: transparent;
  border: 1px solid ${props => props.$variant === 'danger' ? '#FF4444' : '#0FF'};
  color: ${props => props.$variant === 'danger' ? '#FF4444' : '#0FF'};
  padding: 8px 16px;
  border-radius: 8px;
  margin: 0 4px;
  font-family: 'REM', sans-serif;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$variant === 'danger' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 255, 0.1)'};
  }
`;

const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends,
  formatLastActive,
  onRemoveFriend,
  showConfirmRemove,
  setShowConfirmRemove
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <Title>My Friends</Title>
        <FriendsList>
          {friends.map((friend) => (
            <FriendEntry key={friend.userId}>
              <FriendInfo>
                <UserInfo>
                  <div>{friend.userName}</div>
                  <div>{formatLastActive(friend.lastActive)}</div>
                </UserInfo>
                {showConfirmRemove === friend.userId ? (
                  <div>
                    <ActionButton 
                      $variant="danger" 
                      onClick={() => onRemoveFriend(friend.userId)}
                    >
                      Confirm
                    </ActionButton>
                    <ActionButton 
                      onClick={() => setShowConfirmRemove(null)}
                    >
                      Cancel
                    </ActionButton>
                  </div>
                ) : (
                  <ActionButton 
                    $variant="danger"
                    onClick={() => setShowConfirmRemove(friend.userId)}
                  >
                    Remove
                  </ActionButton>
                )}
              </FriendInfo>
            </FriendEntry>
          ))}
        </FriendsList>
      </ModalContent>
    </ModalOverlay>
  );
};

export default FriendsModal;