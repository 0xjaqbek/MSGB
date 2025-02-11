import React, { useState } from 'react';
import styled from 'styled-components';

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

interface NotificationTextProps {
  visible: boolean;
}

const NotificationText = styled.p<NotificationTextProps>`
  color: white;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 10px;
  opacity: ${props => props.visible ? '1' : '0'};
  transition: opacity 0.3s ease;
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
    <div>
      <InviteButton onClick={handleInvite}>
        <span>INVITE A FREN</span>
      </InviteButton>
      <NotificationText visible={showNotification}>
        Invite link copied to clipboard!
      </NotificationText>
    </div>
  );
};

export default InviteComponent;