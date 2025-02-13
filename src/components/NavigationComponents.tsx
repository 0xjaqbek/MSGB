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
import { get, getDatabase, off, onValue, ref, set, update } from 'firebase/database';
import hudBackground from '../assets/HUDbottom.svg';
import InviteComponent from '../InviteComponent';
import ramka from '../assets/ramka.svg';

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
      }
    });

    // Listen for friends list
    onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsList = Object.values(snapshot.val()) as Friend[];
        setFriends(friendsList);
      }
    });

    return () => {
      off(requestsRef);
      off(friendsRef);
    };
  }, [telegramUser]);

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

      // Check if already friends
      const existingFriendRef = ref(db, `users/${telegramUser.id}/friends/${friendId}`);
      const friendSnapshot = await get(existingFriendRef);
      if (friendSnapshot.exists()) {
        setError('Already friends with this user');
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
      setFriendId('');
      setError('Friend request sent!');
    } catch (err) {
      setError('Error sending friend request');
      console.error(err);
    }
  };

  const handleRequest = async (requesterId: string, action: 'accept' | 'reject') => {
    if (!telegramUser) return;

    const db = getDatabase();
    const request = pendingRequests.find(req => req.fromUserId === requesterId);
    
    if (!request) return;

    try {
      // Update request status
      await update(ref(db, `users/${telegramUser.id}/friendRequests/${requesterId}`), {
        status: action
      });

      if (action === 'accept') {
        // Add to both users' friends lists
        const newFriend: Friend = {
          userId: request.fromUserId,
          userName: request.fromUserName,
          addedAt: Date.now()
        };
        
        const currentUserFriend: Friend = {
          userId: telegramUser.id.toString(),
          userName: telegramUser.first_name,
          addedAt: Date.now()
        };

        await Promise.all([
          set(ref(db, `users/${telegramUser.id}/friends/${request.fromUserId}`), newFriend),
          set(ref(db, `users/${request.fromUserId}/friends/${telegramUser.id}`), currentUserFriend)
        ]);
      }
    } catch (err) {
      console.error('Error handling friend request:', err);
    }
  };

  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <h1 className="text-glow text-xl mb-4">Friends</h1>
      
      {/* Friend Request Section */}
      <div className="card">
        <h2 className="text-glow text-lg mb-2">Add Friend</h2>
        <div className="space-y-2">
          <div className="stat-row">
            <input
              type="text"
              placeholder="Enter User ID"
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              className="bg-black/30 border border-cyan-400/30 rounded-lg p-2 text-cyan-400 w-full"
            />
          </div>
          <div className="stat-row">
            <button
              onClick={sendFriendRequest}
              className="bg-transparent border border-cyan-400 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-400/10"
            >
              Send Request
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="card mt-4">
          <h2 className="text-glow text-lg mb-2">Pending Requests</h2>
          {pendingRequests.map((request) => (
            <div key={request.fromUserId} className="stat-row">
              <span className="text-value">{request.fromUserName}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequest(request.fromUserId, 'accept')}
                  className="bg-transparent border border-cyan-400 text-cyan-400 px-3 py-1 rounded-lg hover:bg-cyan-400/10"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRequest(request.fromUserId, 'reject')}
                  className="bg-transparent border border-red-400 text-red-400 px-3 py-1 rounded-lg hover:bg-red-400/10"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List Section */}
      {friends.length > 0 && (
        <div className="card mt-4">
          <h2 className="text-glow text-lg mb-2">My Friends</h2>
          {friends.map((friend) => (
            <div key={friend.userId} className="stat-row">
              <span className="text-value">{friend.userName}</span>
              <span className="text-info">{friend.userId}</span>
            </div>
          ))}
        </div>
      )}

      {/* Invite Section - your existing code */}
      <div 
        style={{
          backgroundImage: `url(${ramka})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          padding: '20px',
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#0FF',
          textAlign: 'center'
        }}
      >
        <p className="text-info mb-4 px-4" style={{ color: 'white' }}>
          Invite friends.<br></br>Each invited friend<br></br>gives you and him 
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