import React from 'react';
import styled from 'styled-components';
import { Home, Target, Users, User } from 'lucide-react';

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

  &:hover {
    opacity: 1;
    color: #88c8ff;
  }

  span {
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
        <Home size={24} />
        <span>Main</span>
      </NavButton>
      <NavButton 
        $isActive={currentPage === 'tasks'} 
        onClick={() => onNavigate('tasks')}
      >
        <Target size={24} />
        <span>Tasks</span>
      </NavButton>
      <NavButton 
        $isActive={currentPage === 'friends'} 
        onClick={() => onNavigate('friends')}
      >
        <Users size={24} />
        <span>Friends</span>
      </NavButton>
      <NavButton 
        $isActive={currentPage === 'account'} 
        onClick={() => onNavigate('account')}
      >
        <User size={24} />
        <span>Account</span>
      </NavButton>
    </NavigationContainer>
  );
};

export default Navigation;