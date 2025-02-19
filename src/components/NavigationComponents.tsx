// components/NavigationComponents.tsx
import React, { useEffect, useState } from 'react';
import { Home, Users, User, CheckSquare } from 'lucide-react';
import { TelegramUser, NavigationPage, Friend, FriendRequest } from '../types';
import { VisitStats } from '../userTracking';
import mainActive from '../assets/mainA.svg';
import mainDefault from '../assets/mainD.svg';
import friendsActive from '../assets/friendsA.svg';
import friendsDefault from '../assets/friendsD.svg';
import accountActive from '../assets/accountA.svg';
import accountDefault from '../assets/accountD.svg';
import tasksActive from '../assets/taskasA.svg';
import tasksDefault from '../assets/tasksD.svg';
import { get, getDatabase, off, onValue, ref, remove, set, update } from 'firebase/database';
import hudBackground from '../assets/HUDbottom.svg';
import InviteComponent from '../InviteComponent';
import ramka from '../assets/ramka.svg';
import styled from 'styled-components';
import FriendsModal from './FriendsModal';
import { AddFriendSection } from './AddFriendSection'; 
import LeaderboardPosition from './LeaderboardPosition';

interface NavigationBarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

interface FriendsPageProps {
  telegramUser: TelegramUser | null;
}

interface AccountPageProps {
  telegramUser: TelegramUser | null;
  userStats: VisitStats | null;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentPage, onNavigate }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '0', 
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-start',  // Changed from center to flex-start
      background: `url(${hudBackground}) no-repeat center bottom`,
      backgroundSize: '100% 100%',
      maxWidth: '100vw', 
      overflow: 'hidden',
      // height: '100px',
      padding: '15px 10px 0'  // Added top padding to push icons down
    }}>
      {[
        { page: 'main', activeImg: mainActive, defaultImg: mainDefault },
        { page: 'friends', activeImg: friendsActive, defaultImg: friendsDefault },
        { page: 'account', activeImg: accountActive, defaultImg: accountDefault },
        { page: 'tasks', activeImg: tasksActive, defaultImg: tasksDefault }
      ].map(({ page, activeImg, defaultImg }) => (
        <button 
          key={page}
          onClick={() => onNavigate(page as NavigationPage)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            marginTop: '5px',  // Added margin top to push down icons
            width: '10vh',
            height: '10vh',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <img 
            src={currentPage === page ? activeImg : defaultImg} 
            alt={page}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </button>
      ))}
    </div>
  );
};

export default NavigationBar;


// Styled Components
const PageContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageTitle = styled.h1`
  color: #0FF;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-family: 'REM', sans-serif;
`;

const InviteSection = styled.div`
  background-image: url(${ramka});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  padding: 20px 20px;
  margin-top: 10px;
  width: min(90%, 360px);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #0FF;
  text-align: center;
  position: relative;
  box-sizing: border-box;
`;

const InviteText = styled.p`
  color: white;
  font-family: 'REM', sans-serif;
  line-height: 1;
  margin-bottom: 16px;
  margin-left: 6px;
  margin-right: 6px;
  width: 100%;
  
  span {
    color: #FFD700;
  }
`;

const InviteWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  width: 100%;
`;

const FriendsButton = styled.button`
  width: min(80%, 300px);
  margin: 20px auto;
  padding: 12px;
  background: transparent;
  border: 1px solid #0FF;
  color: #0FF;
  border-radius: 20px;
  font-family: 'REM', sans-serif;
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
    transform: scale(1.02);
  }
`;

export const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!telegramUser) return;

    const db = getDatabase();
    const requestsRef = ref(db, `users/${telegramUser.id}/friendRequests`);
    const friendsRef = ref(db, `users/${telegramUser.id}/friends`);
    const sentRequestsRef = ref(db, `users/${telegramUser.id}/sentRequests`);

    onValue(sentRequestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requests = Object.values(snapshot.val()).filter(
          (req: any) => req.status === 'pending'
        ) as FriendRequest[];
        setSentRequests(requests);
      } else {
        setSentRequests([]);
      }
    });

    // Listen for friend requests
    onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requests = Object.values(snapshot.val()).filter(
          (req: any) => req.status === 'pending'
        ) as FriendRequest[];
        setPendingRequests(requests);
      } else {
        setPendingRequests([]);
      }
    });

    // Listen for friends list
    onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsList = Object.values(snapshot.val()) as Friend[];
        friendsList.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        setFriends(friendsList);
      } else {
        setFriends([]);
      }
    });

    // Update user's status
    const userStatusRef = ref(db, `users/${telegramUser.id}/status`);
    set(userStatusRef, 'online');
    update(ref(db, `users/${telegramUser.id}`), {
      lastActive: Date.now()
    });

    return () => {
      off(requestsRef);
      off(friendsRef);
      set(userStatusRef, 'offline');
    };
  }, [telegramUser]);

  const formatLastActive = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const showTimedError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 4000);
  };
  
  const handleSendRequest = async (friendId: string) => {
    if (!telegramUser) return;
    
    setIsProcessing(true);
    try {
      const db = getDatabase();
      
      if (friendId === telegramUser.id.toString()) {
        setError('Cannot add yourself as a friend');
        return;
      }
  
      const targetUserRef = ref(db, `users/${friendId}`);
      const snapshot = await get(targetUserRef);
  
      if (!snapshot.exists()) {
        setError('User not found');
        return;
      }
  
      const existingFriendRef = ref(db, `users/${telegramUser.id}/friends/${friendId}`);
      const friendSnapshot = await get(existingFriendRef);
      if (friendSnapshot.exists()) {
        setError('Already friends with this user');
        return;
      }
  
      const [existingRequest, reverseRequest, sentRequest] = await Promise.all([
        get(ref(db, `users/${friendId}/friendRequests/${telegramUser.id}`)),
        get(ref(db, `users/${telegramUser.id}/friendRequests/${friendId}`)),
        get(ref(db, `users/${telegramUser.id}/sentRequests/${friendId}`))
      ]);
  
      if (existingRequest.exists() || reverseRequest.exists() || sentRequest.exists()) {
        setError('Friend request already exists');
        return;
      }
  
      const request: FriendRequest = {
        fromUserId: telegramUser.id.toString(),
        fromUserName: telegramUser.first_name,
        status: 'pending',
        timestamp: Date.now()
      };
  
      const updates: { [key: string]: any } = {
        [`users/${friendId}/friendRequests/${telegramUser.id}`]: request,
        [`users/${telegramUser.id}/sentRequests/${friendId}`]: request
      };
  
      await update(ref(db), updates);
      
      // Send Telegram notification - matches your bot's case 'friendRequest'
      window.Telegram?.WebApp?.sendData(JSON.stringify({
        action: 'friendRequest',
        targetUserId: friendId,
        senderName: telegramUser.first_name
      }));
  
      setError('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Error sending friend request');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const checkPendingRequests = async () => {
      if (!telegramUser) return;
  
      try {
        const db = getDatabase();
        const requestsRef = ref(db, `users/${telegramUser.id}/friendRequests`);
        const snapshot = await get(requestsRef);
  
        if (snapshot.exists()) {
          const requests = Object.values(snapshot.val()).filter(
            (req: any) => req.status === 'pending'
          ) as FriendRequest[];
  
          if (requests.length > 0) {
            // Send notification through Telegram
            window.Telegram?.WebApp?.sendData(JSON.stringify({
              action: 'pendingRequests',
              count: requests.length,
              userId: telegramUser.id
            }));
          }
        }
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    };
  
    checkPendingRequests();
  }, [telegramUser]);
  
  const handleRequest = async (requesterId: string, action: 'accept' | 'reject') => {
    if (!telegramUser) return;
    setIsProcessing(true);
  
    try {
      const db = getDatabase();
      const request = pendingRequests.find(req => req.fromUserId === requesterId);
      if (!request) return;
  
      if (action === 'accept') {
        const updates: { [key: string]: any } = {};
        
        updates[`users/${telegramUser.id}/friends/${requesterId}`] = {
          userId: requesterId,
          userName: request.fromUserName,
          addedAt: Date.now(),
          lastActive: Date.now()
        };
        
        updates[`users/${requesterId}/friends/${telegramUser.id}`] = {
          userId: telegramUser.id.toString(),
          userName: telegramUser.first_name,
          addedAt: Date.now(),
          lastActive: Date.now()
        };
  
        // Remove the request
        updates[`users/${telegramUser.id}/friendRequests/${requesterId}`] = null;
  
        await update(ref(db), updates);
      } else {
        // Simply remove the request if rejected
        await remove(ref(db, `users/${telegramUser.id}/friendRequests/${requesterId}`));
      }
    } catch (err) {
      console.error('Error handling friend request:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const removeFriend = async (friendId: string) => {
    if (!telegramUser) return;
    
    try {
      const db = getDatabase();
      await Promise.all([
        remove(ref(db, `users/${telegramUser.id}/friends/${friendId}`)),
        remove(ref(db, `users/${friendId}/friends/${telegramUser.id}`))
      ]);
  
      // Send removal notification - matches your bot's case 'friendRemoved'
      window.Telegram?.WebApp?.sendData(JSON.stringify({
        action: 'friendRemoved',
        targetUserId: friendId,
        removerName: telegramUser.first_name
      }));
  
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Friends</PageTitle>

      <AddFriendSection
        pendingRequests={pendingRequests}
        sentRequests={sentRequests}
        onSendRequest={handleSendRequest}
        onAcceptRequest={handleRequest}
        onRejectRequest={handleRequest}
        isProcessing={isProcessing}
        error={error}
      />

      <InviteSection>
        <InviteText>
          Invite players —each adds<br/>
          <span>+1 ticket permanently</span><br/>
          for both of you!
        </InviteText>
      </InviteSection>
      
      <InviteWrapper>
        <InviteComponent 
          botUsername="moonstonesgamebot" 
          userId={telegramUser?.id.toString()}
        />
      </InviteWrapper>

      {friends.length > 0 && (
        <>
          <FriendsButton onClick={() => setShowFriendsModal(true)}>
            My Friends ({friends.length})
          </FriendsButton>
          
          <FriendsModal
            isOpen={showFriendsModal}
            onClose={() => setShowFriendsModal(false)}
            friends={friends}
            formatLastActive={formatLastActive}
            onRemoveFriend={removeFriend}
            showConfirmRemove={showConfirmRemove}
            setShowConfirmRemove={setShowConfirmRemove}
          />
        </>
      )}
    </PageContainer>
  );
};

interface UserData {
  scores?: {
    [timestamp: string]: {
      score: number;
      userName: string;
      remainingTime: number;
      timestamp: string;
    }
  };
  [key: string]: any; // For other user data properties
}

const AccountPage: React.FC<AccountPageProps> = ({ telegramUser, userStats }) => {
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [leaderboardPosition, setLeaderboardPosition] = useState<number>(0);
  const [invitesCount, setInvitesCount] = useState<number>(0);
  const [friendsCount, setFriendsCount] = useState<number>(0);

  const calculateLeaderboardPosition = async (userId: string): Promise<number> => {
    const db = getDatabase();
    const usersRef = ref(db, '/users');
    
    try {
      const snapshot = await get(usersRef);
      if (!snapshot.exists()) return 1;
      
      const users = snapshot.val();
      const userScores: { userId: string; totalScore: number; userName: string }[] = [];
  
      // Get totalScore from each user and ensure it's a number
      Object.entries(users).forEach(([id, userData]: [string, any]) => {
        const score = Number(userData.totalScore) || 0;
        userScores.push({
          userId: id,
          totalScore: score,
          userName: userData.userName || 'Unknown'
        });
      });
  
      // Sort users by total score in descending order
      userScores.sort((a, b) => b.totalScore - a.totalScore);
      
      // For debugging
      console.log('Sorted Leaderboard:', userScores.map(user => 
        `${user.userName}: ${user.totalScore}`
      ));
  
      // Find user's position (using findIndex and adding 1 for human-readable position)
      const position = userScores.findIndex(user => user.userId === userId) + 1;
      
      console.log(`User ${userId} position: ${position}`);
      return position;
    } catch (error) {
      console.error('Error calculating leaderboard position:', error);
      return 1;
    }
  };

    // Inside AccountPage component, update the fetchData function
    const fetchData = async () => {
      if (telegramUser) {
        try {
          const db = getDatabase();
        
          const userRef = ref(db, `users/${telegramUser.id}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            
            // Set total points
            setTotalPoints(userData.totalScore || 0);
            
            // Count invites - check if invitedUsers exists and is an array
            if (userData.referrals?.invitedUsers) {
              const invites = userData.referrals.invitedUsers;
              setInvitesCount(Array.isArray(invites) ? invites.length : 0);
            } else {
              setInvitesCount(0);
            }

            // Count friends
            if (userData.friends) {
              setFriendsCount(Object.keys(userData.friends).length);
            } else {
              setFriendsCount(0);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

  // Update leaderboard position when totalPoints changes
  useEffect(() => {
    const updateLeaderboardPosition = async () => {
      if (telegramUser) {
        try {
          const position = await calculateLeaderboardPosition(telegramUser.id.toString());
          setLeaderboardPosition(position);
        } catch (error) {
          console.error('Error updating leaderboard position:', error);
        }
      }
    };
  
    updateLeaderboardPosition();
  }, [telegramUser, totalPoints]);

  if (!telegramUser) {
    return <div className="page-container">
      <span className="text-glow animate-pulse">Loading...</span>
    </div>;
  }

  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <h1 className="text-glow text-xl mb-4">My Account</h1>
      <div className="card">
        <div className="space-y-2">
          <div className="stat-row">
            <span className="text-info">Name:</span>
            <span className="text-value">{telegramUser.first_name}</span>
          </div>
          <div className="stat-row">
            <span className="text-info">User ID:</span>
            <span className="text-value">{telegramUser.id}</span>
          </div>
          <div className="stat-row">
            <span className="text-info">Leaderboard Position:</span>
            <span className="text-value">
              #<LeaderboardPosition userId={telegramUser.id.toString()} />
            </span>
          </div>
          <div className="stat-row">
            <span className="text-info">Total Points:</span>
            <span className="text-value">{totalPoints}</span>
          </div>
          <div className="stat-row">
            <span className="text-info">Invites:</span>
            <span className="text-value">{invitesCount}</span>
          </div>
          <div className="stat-row">
            <span className="text-info">Friends:</span>
            <span className="text-value">{friendsCount}</span>
          </div>
          {userStats && (
            <>
              <div className="stat-row">
                <span className="text-info">Current Streak:</span>
                <span className="text-value">{userStats.currentStreak} days</span>
              </div>
              <div className="stat-row">
                <span className="text-info">Highest Streak:</span>
                <span className="text-value">{userStats.highestStreak} days</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <h1 className="text-glow text-xl mb-4">Daily Tasks</h1>
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Today's Tasks</h2>
        <div className="space-y-2">
          <div className="stat-row">
            <span>Play 5 games</span>
            <span className="text-glow">0/5</span>
          </div>
          <div className="stat-row">
            <span>Score 50 points</span>
            <span className="text-glow">0/50</span>
          </div>
          <div className="stat-row">
            <span>Visit the app</span>
            <span className="text-green-400">✓</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Weekly Challenges</h2>
        <p className="text-info">Coming soon...</p>
      </div>
    </div>
  );
};

export {
  NavigationBar,
  AccountPage,
  TasksPage
};