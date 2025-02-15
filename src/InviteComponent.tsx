import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const InviteButton = styled.button`
  background: transparent;
  border: 2px solid #FFD700;
  color: #FFD700;
  padding: 12px 32px;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  font-family: 'REM', monospace;
  width: 80%;
  margin: 20px auto;
  line-height: 0.9;

  span {
    font-size: 22px;
    font-weight: bold;
    line-height: 1.4;
    letter-spacing: 1px;
  }

  &:hover {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    transform: scale(1.05);
  }
`;

const NotificationOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  opacity: ${props => props.$visible ? '1' : '0'};
  pointer-events: none;
  transition: opacity 0.3s ease;
  white-space: nowrap;
  z-index: 10;
`;

const ClickToCopyText = styled.p`
  color: white;
  text-align: center;
  font-size: 0.8rem;
  margin-top: 10px;
  opacity: 0.7;
`;

interface InviteComponentProps {
  botUsername: string;
  userId?: string;
}

const InviteComponent: React.FC<InviteComponentProps> = ({ botUsername, userId }) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleInvite = async () => {
    const inviteLink = `https://t.me/${botUsername}?start=ref_${userId}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  return (
    <Container>
      <InviteButton onClick={handleInvite}>
        <span>INVITE TO GAME</span>
      </InviteButton>
      <NotificationOverlay $visible={showNotification}>
        Invite link copied to clipboard!
      </NotificationOverlay>
      <ClickToCopyText>Click to copy invite link</ClickToCopyText>
    </Container>
  );
};

export default InviteComponent;