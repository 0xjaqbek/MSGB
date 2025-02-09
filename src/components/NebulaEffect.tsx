import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import plamy from '../src/assets/plamy.svg';
import plamy1 from '../src/assets/plamy1.svg';
import plamy2 from '../src/assets/plamy2.svg';

const float = keyframes`
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    transform: translate(var(--moveX), var(--moveY)) rotate(var(--rotation));
  }
`;

const NebulaImage = styled.img<{ $duration: number; $delay: number; $moveX: number; $moveY: number; $rotation: number }>`
  position: fixed;
  width: 25vh;
  height: 25vh;
  pointer-events: none;
  --moveX: ${props => props.$moveX}px;
  --moveY: ${props => props.$moveY}px;
  --rotation: ${props => props.$rotation}deg;
  animation: ${float} ${props => props.$duration}s linear ${props => props.$delay}s infinite alternate;
`;

interface NebulaProps {
  src: string;
  index: number;
}

const Nebula: React.FC<NebulaProps> = ({ src, index }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [config, setConfig] = useState({
    duration: 0,
    delay: 0,
    moveX: 0,
    moveY: 0,
    rotation: 0
  });

  useEffect(() => {
    // Random initial position
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const x = Math.random() * screenWidth;
    const y = Math.random() * screenHeight;
    
    // Random movement configuration
    const moveX = (Math.random() - 0.5) * 200; // -100 to 100px
    const moveY = (Math.random() - 0.5) * 200; // -100 to 100px
    const duration = 15 + Math.random() * 10; // 15-25 seconds
    const delay = Math.random() * -20; // Negative delay for immediate start at different positions
    const rotation = (Math.random() - 0.5) * 90; // -45 to 45 degrees

    setPosition({ x, y });
    setConfig({ duration, delay, moveX, moveY, rotation });
  }, []);

  return (
    <NebulaImage
      src={src}
      alt="nebula"
      style={{
        left: position.x,
        top: position.y,
      }}
      $duration={config.duration}
      $delay={config.delay}
      $moveX={config.moveX}
      $moveY={config.moveY}
      $rotation={config.rotation}
    />
  );
};

const NebulaEffect: React.FC = () => {
  const nebulae = [plamy, plamy1, plamy2];
  const [instances] = useState(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      src: nebulae[Math.floor(Math.random() * nebulae.length)]
    }))
  );

  return (
    <>
      {instances.map(instance => (
        <Nebula key={instance.id} src={instance.src} index={instance.id} />
      ))}
    </>
  );
};

export default NebulaEffect;