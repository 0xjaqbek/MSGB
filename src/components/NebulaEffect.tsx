import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import plamy from '../assets/plamy.svg';
import plamy1 from '../assets/plamy1.svg';
import plamy2 from '../assets/plamy2.svg';

const move = keyframes`
  0% {
    transform: translate(var(--startX), var(--startY)) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--endX), var(--endY)) rotate(var(--rotation));
    opacity: 0;
  }
`;

const NebulaImage = styled.img<{ 
  $duration: number; 
  $delay: number; 
  $startX: number;
  $startY: number;
  $endX: number;
  $endY: number;
  $rotation: number 
}>`
  position: fixed;
  width: 25vh;
  height: 25vh;
  pointer-events: none;
  opacity: 0.4;
  --startX: ${props => props.$startX}px;
  --startY: ${props => props.$startY}px;
  --endX: ${props => props.$endX}px;
  --endY: ${props => props.$endY}px;
  --rotation: ${props => props.$rotation}deg;
  animation: ${move} ${props => props.$duration}s linear ${props => props.$delay}s infinite;
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
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    rotation: 0
  });

  useEffect(() => {
    const generatePath = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Generate random diagonal path
      const paths = [
        // Bottom-left to top-right
        {
          startX: -screenWidth * 0.2,
          startY: screenHeight * 1.2,
          endX: screenWidth * 1.2,
          endY: -screenHeight * 0.2
        },
        // Top-left to bottom-right
        {
          startX: -screenWidth * 0.2,
          startY: -screenHeight * 0.2,
          endX: screenWidth * 1.2,
          endY: screenHeight * 1.2
        },
        // Right to left
        {
          startX: screenWidth * 1.2,
          startY: screenHeight * 0.5,
          endX: -screenWidth * 0.2,
          endY: screenHeight * 0.3
        }
      ];

      const path = paths[Math.floor(Math.random() * paths.length)];
      
      return {
        ...path,
        duration: 20 + Math.random() * 10, // 20-30 seconds
        delay: Math.random() * -15, // Stagger start times
        rotation: 360 + Math.random() * 360 // 360-720 degrees rotation
      };
    };

    const newConfig = generatePath();
    setConfig(newConfig);
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
      $startX={config.startX}
      $startY={config.startY}
      $endX={config.endX}
      $endY={config.endY}
      $rotation={config.rotation}
    />
  );
};

const NebulaEffect: React.FC = () => {
  const nebulae = [plamy, plamy1, plamy2];
  const [instances] = useState(() => 
    Array.from({ length: 3 }, (_, i) => ({
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