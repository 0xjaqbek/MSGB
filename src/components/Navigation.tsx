import React from 'react';
import styled from 'styled-components';

const NavigationContainer = styled.div`
  position: fixed;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 0.8rem;
  border-radius: 20px;
  display: flex;
  gap: 2rem;
  z-index: 1000;
`;

const NavButton = styled.button<{ $isActive?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$isActive ? '#88c8ff' : '#ffffff'};
  opacity: ${props => props.$isActive ? 1 : 0.6};
  cursor: ${props => props.$isActive ? 'default' : 'pointer'};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s ease;
  min-width: 50px;

  &:hover {
    opacity: 1;
    color: #88c8ff;
  }

  .icon {
    font-size: 1.5rem;
    margin-bottom: 0.2rem;
  }

  .label {
    font-size: 0.7rem;
  }
`;

type Page = 'main' | 'tasks' | 'friends' | 'account';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  return (
    <NavigationContainer>
      <NavButton 
        $isActive={currentPage === 'main'} 
        onClick={() => onNavigate('main')}
        disabled={currentPage === 'main'}
      >
        <div className="icon">🎮</div>
        <div className="label">Main</div>
      </NavButton>
      <NavButton 
        $isActive={currentPage === 'tasks'} 
        onClick={() => onNavigate('tasks')}
      >
        <div className="icon">📋</div>
        <div className="label">Tasks</div>
      </NavButton>
      <NavButton 
        $isActive={currentPage === 'friends'} 
        onClick={() => onNavigate('friends')}
      >
        <div className="icon">👥</div>
        <div className="label">Friends</div>
      </NavButton>
      <NavButton 
        $isActive={currentPage === 'account'} 
        onClick={() => onNavigate('account')}
      >
        <div className="icon">👤</div>
        <div className="label">Account</div>
      </NavButton>
    </NavigationContainer>
  );
};

export default Navigation;