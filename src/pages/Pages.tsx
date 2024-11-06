import React from 'react';
import styled from 'styled-components';

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

export const TasksPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Daily Tasks</h1>
      {/* Add your tasks content */}
    </PageContainer>
  );
};

export const FriendsPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Friends</h1>
      {/* Add your friends content */}
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