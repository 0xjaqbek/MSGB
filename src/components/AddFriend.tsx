// Create a new file: src/components/AddFriend.tsx
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set, update, onValue, off } from 'firebase/database';
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
  }, [currentUserId]);

  const sendFriendRequest = async () => {
    if (!friendId.trim()) {
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
      const existingFriendRef = ref(db, `users/${currentUserId}/friends/${friendId}`);
      const friendSnapshot = await get(existingFriendRef);
      if (friendSnapshot.exists()) {
        setError('Already friends with this user');
        return;
      }

      // Send friend request
      const request: FriendRequest = {
        fromUserId: currentUserId,
        fromUserName: currentUserName,
        status: 'pending',
        timestamp: Date.now()
      };

      await set(ref(db, `users/${friendId}/friendRequests/${currentUserId}`), request);
      setFriendId('');
      setError('Friend request sent!');
    } catch (err) {
      setError('Error sending friend request');
      console.error(err);
    }
  };

  const handleRequest = async (requesterId: string, action: 'accept' | 'reject') => {
    const db = getDatabase();
    const request = pendingRequests.find(req => req.fromUserId === requesterId);
    
    if (!request) return;

    try {
      // Update request status
      await update(ref(db, `users/${currentUserId}/friendRequests/${requesterId}`), {
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
          userId: currentUserId,
          userName: currentUserName,
          addedAt: Date.now()
        };

        await Promise.all([
          set(ref(db, `users/${currentUserId}/friends/${request.fromUserId}`), newFriend),
          set(ref(db, `users/${request.fromUserId}/friends/${currentUserId}`), currentUserFriend)
        ]);
      }
    } catch (err) {
      console.error('Error handling friend request:', err);
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
        />
        <ActionButton onClick={sendFriendRequest}>Send Request</ActionButton>
        {error && <p style={{ color: '#FF4444', marginTop: '5px' }}>{error}</p>}
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
                >
                  Accept
                </ActionButton>
                <ActionButton 
                  $variant="reject"
                  onClick={() => handleRequest(request.fromUserId, 'reject')}
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