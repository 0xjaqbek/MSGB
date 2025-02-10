import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, get, set } from 'firebase/database';
import { TelegramUser } from '../types';

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #fff;
  z-index: 1;
  position: relative;
`;

const Card = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 15px;
  padding: 20px;
  margin: 10px 0;
  width: 90%;
  max-width: 400px;
`;

const Button = styled.button`
  width: 100%;
  background: transparent;
  border: 2px solid #0FF;
  color: #0FF;
  padding: 12px;
  border-radius: 12px;
  margin: 8px 0;
  font-family: 'REM', sans-serif;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.1);
  }
`;

const Input = styled.input`
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid #0FF;
  color: #0FF;
  padding: 12px;
  border-radius: 12px;
  margin: 8px 0;
  font-family: 'REM', sans-serif;

  &::placeholder {
    color: rgba(0, 255, 255, 0.5);
  }
`;

const Text = styled.div`
  color: #0FF;
  margin: 8px 0;
  text-align: center;
  font-family: 'REM', sans-serif;
`;

export const TasksPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Daily Tasks</h1>
      {/* Add your tasks content */}
    </PageContainer>
  );
};

interface FriendsPageProps {
  telegramUser: TelegramUser | null;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  const [friendCode, setFriendCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState('');

  const generateFriendCode = async () => {
    if (!telegramUser) return;
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const db = getDatabase();
    await set(ref(db, `friendCodes/${code}`), {
      userId: telegramUser.id,
      createdAt: Date.now()
    });
    
    setFriendCode(code);
  };

  const handleInvite = () => {
    if (!telegramUser) return;
    const inviteLink = `https://t.me/moonstonesgamebot?start=invite_${telegramUser.id}`;
    window.Telegram?.WebApp?.sendData(JSON.stringify({ 
      action: 'share_invite',
      link: inviteLink
    }));
  };

  const redeemCode = async () => {
    if (!telegramUser || !inputCode) return;
    
    try {
      const db = getDatabase();
      const codeRef = ref(db, `friendCodes/${inputCode}`);
      const snapshot = await get(codeRef);
      
      if (!snapshot.exists()) {
        setMessage('Invalid code');
        return;
      }
      
      const codeData = snapshot.val();
      if (codeData.userId === telegramUser.id) {
        setMessage('Cannot use your own code');
        return;
      }
      
      // Add friends connection
      await set(ref(db, `users/${telegramUser.id}/friends/${codeData.userId}`), {
        addedAt: Date.now()
      });
      
      await set(ref(db, `users/${codeData.userId}/friends/${telegramUser.id}`), {
        addedAt: Date.now()
      });
      
      // Remove used code
      await set(codeRef, null);
      
      setMessage('Friend added successfully!');
      setInputCode('');
    } catch (error) {
      setMessage('Error redeeming code');
    }
  };

  return (
    <PageContainer>
      <h1>Friends</h1>
      <Card>
        <Button onClick={handleInvite}>
          Invite Friends
        </Button>
        <Text>- or -</Text>
        <Button onClick={generateFriendCode}>
          Generate Friend Code
        </Button>
        {friendCode && (
          <Text>Your code: {friendCode}</Text>
        )}
      </Card>

      <Card>
        <Input
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          placeholder="Enter friend code"
          maxLength={6}
        />
        <Button onClick={redeemCode}>
          Add Friend
        </Button>
        {message && (
          <Text>{message}</Text>
        )}
      </Card>
    </PageContainer>
  );
};

export const AccountPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>My Account</h1>
      {/* Add your account content */}
    </PageContainer>
  );
};