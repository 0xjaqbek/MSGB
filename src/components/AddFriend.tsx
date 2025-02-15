import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set, update, onValue, off, remove } from 'firebase/database';
import styled from 'styled-components';
import { Friend, FriendRequest } from '@/types';

const AddFriendInput = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: #0FF;
  width: 100%;
  margin-bottom: 10px;

  &::placeholder {
    color: rgba(0, 255, 255, 0.5);
  }
`;

const ActionButton = styled.button<{ $variant?: 'accept' | 'reject' }>`
  background: transparent;
  border: 1px solid ${props => props.$variant === 'reject' ? '#FF4444' : '#0FF'};
  color: ${props => props.$variant === 'reject' ? '#FF4444' : '#0FF'};
  padding: 8px 16px;
  border-radius: 8px;
  margin: 5px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RequestsSection = styled.div`
  margin-top: 20px;
`;

interface AddFriendProps {
  currentUserId: string;
  currentUserName: string;
}

export const AddFriend: React.FC<AddFriendProps> = ({ currentUserId, currentUserName }) => {
  const [friendId, setFriendId] = useState('');
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    const requestsRef = ref(db, `users/${currentUserId}/friendRequests`);
    const friendsRef = ref(db, `users/${currentUserId}/friends`);

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
        setFriends(friendsList);
      } else {
        setFriends([]);
      }
    });

    return () => {
      off(requestsRef);
      off(friendsRef);
    };
  }, [currentUserId]);

  const sendFriendRequest = async () => {
    if (isProcessing) return;
    if (!friendId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setIsProcessing(true);
    try {
      const db = getDatabase();
      
      // Check if trying to add self
      if (friendId === currentUserId) {
        setError('Cannot add yourself as a friend');
        return;
      }

      // Check if target user exists
      const targetUserRef = ref(db, `users/${friendId}`);
      const snapshot = await get(targetUserRef);

      if (!snapshot.exists()) {
        setError('User not found');
        return;
      }

      // Check for existing friendship
      const existingFriendRef = ref(db, `users/${currentUserId}/friends/${friendId}`);
      const friendSnapshot = await get(existingFriendRef);
      if (friendSnapshot.exists()) {
        setError('Already friends with this user');
        return;
      }

      // Check for existing requests in both directions
      const [existingRequest, reverseRequest] = await Promise.all([
        get(ref(db, `users/${friendId}/friendRequests/${currentUserId}`)),
        get(ref(db, `users/${currentUserId}/friendRequests/${friendId}`))
      ]);

      if (existingRequest.exists() || reverseRequest.exists()) {
        setError('Friend request already exists');
        return;
      }

      // Create the friend request
      const request: FriendRequest = {
        fromUserId: currentUserId,
        fromUserName: currentUserName,
        status: 'pending',
        timestamp: Date.now()
      };

      await set(ref(db, `users/${friendId}/friendRequests/${currentUserId}`), request);
      
      // Send Telegram notification
      window.Telegram?.WebApp?.sendData(JSON.stringify({
        action: 'friendRequest',
        targetUserId: friendId,
        senderName: currentUserName
      }));

      setFriendId('');
      setError('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('Error sending friend request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequest = async (requesterId: string, action: 'accept' | 'reject') => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const db = getDatabase();
      const request = pendingRequests.find(req => req.fromUserId === requesterId);
      if (!request) return;

      if (action === 'accept') {
        // Update both users' friends lists and calculate bonus tickets
        const updates: { [key: string]: any } = {};
        
        // Add to friends lists
        updates[`users/${currentUserId}/friends/${requesterId}`] = {
          userId: requesterId,
          userName: request.fromUserName,
          addedAt: Date.now(),
          lastActive: Date.now()
        };
        
        updates[`users/${requesterId}/friends/${currentUserId}`] = {
          userId: currentUserId,
          userName: currentUserName,
          addedAt: Date.now(),
          lastActive: Date.now()
        };

        // Calculate bonus tickets
        const [userFriendsSnapshot, requesterFriendsSnapshot] = await Promise.all([
          get(ref(db, `users/${currentUserId}/friends`)),
          get(ref(db, `users/${requesterId}/friends`))
        ]);

        const userFriendsCount = userFriendsSnapshot.exists() ? 
          Object.keys(userFriendsSnapshot.val()).length : 0;
        const requesterFriendsCount = requesterFriendsSnapshot.exists() ? 
          Object.keys(requesterFriendsSnapshot.val()).length : 0;

        const userBonusTickets = Math.floor((userFriendsCount + 1) / 2);
        const requesterBonusTickets = Math.floor((requesterFriendsCount + 1) / 2);

        updates[`users/${currentUserId}/ticketsFromFriends`] = userBonusTickets;
        updates[`users/${requesterId}/ticketsFromFriends`] = requesterBonusTickets;

        // Update request status
        updates[`users/${currentUserId}/friendRequests/${requesterId}/status`] = 'accepted';

        await update(ref(db), updates);

        // Send acceptance notification
        window.Telegram?.WebApp?.sendData(JSON.stringify({
          action: 'friendRequestAccepted',
          targetUserId: requesterId,
          accepterName: currentUserName
        }));
      } else {
        // Remove the request if rejected
        await remove(ref(db, `users/${currentUserId}/friendRequests/${requesterId}`));
      }
    } catch (err) {
      console.error('Error handling friend request:', err);
      setError('Error processing friend request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-glow text-lg mb-4">Add Friend</h2>
      <div>
        <AddFriendInput
          type="text"
          placeholder="Enter User ID"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          disabled={isProcessing}
        />
        <ActionButton 
          onClick={sendFriendRequest}
          disabled={isProcessing}
        >
          Send Request
        </ActionButton>
        {error && (
          <p style={{ 
            color: error.includes('sent') ? '#0FF' : '#FF4444', 
            marginTop: '5px' 
          }}>
            {error}
          </p>
        )}
      </div>

      <RequestsSection>
        <h3 className="text-glow text-md mb-2">Pending Requests</h3>
        {pendingRequests.length === 0 ? (
          <p className="text-info">No pending requests</p>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.fromUserId} className="stat-row">
              <span className="text-value">{request.fromUserName}</span>
              <div>
                <ActionButton 
                  onClick={() => handleRequest(request.fromUserId, 'accept')}
                  disabled={isProcessing}
                >
                  Accept
                </ActionButton>
                <ActionButton 
                  $variant="reject"
                  onClick={() => handleRequest(request.fromUserId, 'reject')}
                  disabled={isProcessing}
                >
                  Reject
                </ActionButton>
              </div>
            </div>
          ))
        )}
      </RequestsSection>

      <RequestsSection>
        <h3 className="text-glow text-md mb-2">Friends</h3>
        {friends.length === 0 ? (
          <p className="text-info">No friends yet</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.userId} className="stat-row">
              <span className="text-value">{friend.userName}</span>
              <span className="text-info">{friend.userId}</span>
            </div>
          ))
        )}
      </RequestsSection>
    </div>
  );
};