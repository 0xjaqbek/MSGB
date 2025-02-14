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

const FriendsPage: React.FC<FriendsPageProps> = ({ telegramUser }) => {
  const [friendId, setFriendId] = useState('');
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramUser) return;

    const db = getDatabase();
    const requestsRef = ref(db, `users/${telegramUser.id}/friendRequests`);
    const friendsRef = ref(db, `users/${telegramUser.id}/friends`);

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

    // Listen for friends list and their activities
    onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsList = Object.values(snapshot.val()) as Friend[];
        // Sort friends by last active time
        friendsList.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        setFriends(friendsList);
      } else {
        setFriends([]);
      }
    });

    // Update user's own active status
    const userStatusRef = ref(db, `users/${telegramUser.id}/status`);
    set(userStatusRef, 'online');
    update(ref(db, `users/${telegramUser.id}`), {
      lastActive: Date.now()
    });

    return () => {
      // Clean up listeners and set status to offline
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

const sendFriendRequest = async () => {
  if (!telegramUser || !friendId.trim()) {
    setError('Please enter a User ID');
    return;
  }

  try {
    const db = getDatabase();
    const targetUserRef = ref(db, `users/${friendId}`);
    const snapshot = await get(targetUserRef);

    if (!snapshot.exists()) {
      setError('User not found');
      return;
    }

    if (friendId === telegramUser.id.toString()) {
      setError('Cannot add yourself as a friend');
      return;
    }

    const existingFriendRef = ref(db, `users/${telegramUser.id}/friends/${friendId}`);
    const friendSnapshot = await get(existingFriendRef);
    if (friendSnapshot.exists()) {
      setError('Already friends with this user');
      return;
    }

    const existingRequestRef = ref(db, `users/${friendId}/friendRequests/${telegramUser.id}`);
    const requestSnapshot = await get(existingRequestRef);
    if (requestSnapshot.exists()) {
      setError('Friend request already sent');
      return;
    }

    // Send friend request
    const request: FriendRequest = {
      fromUserId: telegramUser.id.toString(),
      fromUserName: telegramUser.first_name,
      status: 'pending',
      timestamp: Date.now()
    };

    await set(ref(db, `users/${friendId}/friendRequests/${telegramUser.id}`), request);
    
    // Send Telegram notification
    window.Telegram?.WebApp?.sendData(JSON.stringify({
      action: 'friendRequest',
      targetUserId: friendId,
      senderName: telegramUser.first_name
    }));

    setFriendId('');
    setError('Friend request sent!');
  } catch (err) {
    console.error('Error sending friend request:', err);
    setError('Error sending friend request');
  }
};

const handleRequest = async (requesterId: string, action: 'accept' | 'reject') => {
  if (!telegramUser) return;

  const db = getDatabase();
  const request = pendingRequests.find(req => req.fromUserId === requesterId);
  
  if (!request) return;

  try {
    await update(ref(db, `users/${telegramUser.id}/friendRequests/${requesterId}`), {
      status: action
    });

    if (action === 'accept') {
      const newFriend: Friend = {
        userId: request.fromUserId,
        userName: request.fromUserName,
        addedAt: Date.now(),
        lastActive: Date.now(),
        status: 'offline'
      };
      
      const currentUserFriend: Friend = {
        userId: telegramUser.id.toString(),
        userName: telegramUser.first_name,
        addedAt: Date.now(),
        lastActive: Date.now(),
        status: 'online'
      };

      await Promise.all([
        set(ref(db, `users/${telegramUser.id}/friends/${request.fromUserId}`), newFriend),
        set(ref(db, `users/${request.fromUserId}/friends/${telegramUser.id}`), currentUserFriend)
      ]);

      // Send acceptance notification
      window.Telegram?.WebApp?.sendData(JSON.stringify({
        action: 'friendRequestAccepted',
        targetUserId: request.fromUserId,
        accepterName: telegramUser.first_name
      }));
    }

    await remove(ref(db, `users/${telegramUser.id}/friendRequests/${requesterId}`));
  } catch (err) {
    console.error('Error handling friend request:', err);
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

    // Send removal notification
    window.Telegram?.WebApp?.sendData(JSON.stringify({
      action: 'friendRemoved',
      targetUserId: friendId,
      removerName: telegramUser.first_name
    }));

    setShowConfirmRemove(null);
  } catch (err) {
    console.error('Error removing friend:', err);
  }
};

  const renderBox = (title: string, children: React.ReactNode) => (
    <div style={{
      backgroundImage: `url(${ramka})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      marginBottom: '20px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#0FF'
    }}>
      <h2 className="text-glow text-lg mb-4">{title}</h2>
      {children}
    </div>
  );

  const ActionButton = styled.button<{ $variant?: 'danger' | 'success' }>`
    background: transparent;
    border: 1px solid ${props => props.$variant === 'danger' ? '#FF4444' : '#0FF'};
    color: ${props => props.$variant === 'danger' ? '#FF4444' : '#0FF'};
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'REM', sans-serif;
    font-size: 0.9rem;
    margin: 4px;
    transition: all 0.3s ease;

    &:hover {
      background: ${props => props.$variant === 'danger' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 255, 0.1)'};
      box-shadow: 0 0 10px ${props => props.$variant === 'danger' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 255, 0.3)'};
    }
  `;

return (
  <div className="page-container" style={{ marginTop: '30px' }}>
    <h1 className="text-glow text-xl mb-4">Friends</h1>

    {/* Add Friend Section */}
    <div style={{
      backgroundImage: `url(${ramka})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      marginTop: '20px',
      width: '90%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#0FF',
      textAlign: 'center'
    }}>
      <input
        type="text"
        placeholder="Enter User ID"
        value={friendId}
        onChange={(e) => setFriendId(e.target.value)}
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#0FF',
          width: '60%',
          fontFamily: 'REM, sans-serif',
          fontSize: '0.9rem',
          marginBottom: '8px'
        }}
      />
      <ActionButton onClick={sendFriendRequest}>
        Add Friend
      </ActionButton>
      {error && (
        <div style={{ 
          color: error.includes('sent') ? '#0FF' : '#FF4444',
          fontSize: '0.8rem',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>

    {/* Pending Requests Section */}
    {pendingRequests.length > 0 && (
      <div style={{
        backgroundImage: `url(${ramka})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '20px',
        marginTop: '20px',
        width: '90%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#0FF',
        textAlign: 'center'
      }}>
        <h2 className="text-glow text-lg mb-2">Pending Requests</h2>
        {pendingRequests.map((request) => (
          <div key={request.fromUserId} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              width: '100%',
              marginBottom: '8px'
            }}
          >
            <span style={{ color: 'white' }}>{request.fromUserName}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <ActionButton onClick={() => handleRequest(request.fromUserId, 'accept')}>
                Accept
              </ActionButton>
              <ActionButton $variant="danger" onClick={() => handleRequest(request.fromUserId, 'reject')}>
                Reject
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Friends List Section */}
    {friends.length > 0 && (
      <div style={{
        backgroundImage: `url(${ramka})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '20px',
        marginTop: '20px',
        width: '90%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#0FF',
        textAlign: 'center'
      }}>
        <h2 className="text-glow text-lg mb-2">My Friends</h2>
        {friends.map((friend) => (
          <div key={friend.userId} 
            style={{ 
              width: '100%',
              borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
              padding: '8px 0',
              marginBottom: '8px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div>
                <div style={{ color: 'white' }}>{friend.userName}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(0, 255, 255, 0.7)' }}>
                  {formatLastActive(friend.lastActive)}
                </div>
              </div>
              {showConfirmRemove === friend.userId ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <ActionButton $variant="danger" onClick={() => removeFriend(friend.userId)}>
                    Confirm
                  </ActionButton>
                  <ActionButton onClick={() => setShowConfirmRemove(null)}>
                    Cancel
                  </ActionButton>
                </div>
              ) : (
                <ActionButton $variant="danger" onClick={() => setShowConfirmRemove(friend.userId)}>
                  Remove
                </ActionButton>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Invite Section */}
    <div style={{
      backgroundImage: `url(${ramka})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
      marginTop: '20px',
      width: '90%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#0FF',
      textAlign: 'center'
    }}>
      <p className="text-info mb-4 px-4" style={{ color: 'white' }}>
        Invite friends.<br/>Each invited friend<br/>gives you and him 
        <span style={{ color: '#FFD700' }}> +1 ticket permanently</span>
      </p>
    </div>
    
    <div className="mt-4 flex justify-center">
      <InviteComponent 
        botUsername="moonstonesgamebot" 
        userId={telegramUser?.id.toString()}
      />
    </div>
  </div>
);
};

const calculateLeaderboardPosition = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const allScoresRef = ref(db, '/');
  
  try {
    const snapshot = await get(allScoresRef);
    if (!snapshot.exists()) return 0;

    // Get all users and their scores
    const users = snapshot.val();
    const userScores: { userId: string; totalPoints: number }[] = [];

    // Calculate total points for each user
    for (const [id, userData] of Object.entries(users)) {
      if (typeof userData === 'object' && userData !== null && 'scores' in userData) {
        const scores = Object.values(userData.scores as Record<string, { score: number }>);
        const totalPoints = scores.reduce((sum, entry) => sum + (entry.score || 0), 0);
        userScores.push({ userId: id, totalPoints });
      }
    }

    // Sort users by score in descending order
    userScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // Find position of current user
    const position = userScores.findIndex(user => user.userId === userId) + 1;
    return position;
  } catch (error) {
    console.error('Error calculating leaderboard position:', error);
    return 0;
  }
};

const AccountPage: React.FC<AccountPageProps> = ({ telegramUser, userStats }) => {
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [leaderboardPosition, setLeaderboardPosition] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (telegramUser) {
        try {
          // Fetch total points
          const db = getDatabase();
          const playerScoresRef = ref(db, `/${telegramUser.id}/scores`);
          const snapshot = await get(playerScoresRef);
          
          if (snapshot.exists()) {
            const scores = snapshot.val();
            const total = Object.values(scores).reduce((sum: number, entry: any) => {
              return sum + (entry.score || 0);
            }, 0);
            setTotalPoints(total);
          }

          // Calculate leaderboard position
          const position = await calculateLeaderboardPosition(telegramUser.id.toString());
          setLeaderboardPosition(position);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [telegramUser]);

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
            <span className="text-value">#{leaderboardPosition}</span>
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
              <div className="stat-row">
                <span className="text-info">Total Points:</span>
                <span className="text-value">{totalPoints}</span>
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
  FriendsPage,
  AccountPage,
  TasksPage
};