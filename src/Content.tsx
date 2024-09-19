import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import startImage from './start.png';
import stone1 from './stone1.png';
import stone2 from './stone2.png';
import stone3 from './stone3.png';
import stone4 from './stone4.png';

const moveAnimation = keyframes`
  0% {
    transform: translate(var(--startX), var(--startY));
  }
  100% {
    transform: translate(var(--endX), var(--endY));
  }
`;

const imageAnimation = keyframes`
  0% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(0.95) translateY(3%);
  }
  100% {
    transform: scale(1) translateY(0);
  }
`;

const StyledContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  touch-action: none;
  font-family: 'Lato', sans-serif; /* Added Lato font */
  background: -webkit-linear-gradient(white, #38495a)
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
`;

const StartButton = styled.img<{ isClicked: boolean }>`
  width: 75vw;
  cursor: pointer;
  ${({ isClicked }) =>
    isClicked
      ? css`
          display: none;
        `
      : css`
          animation: ${imageAnimation} 2s infinite;
        `}
`;

const Stone = styled.img<{ speed: number; startX: number; startY: number; endX: number; endY: number }>`
  position: absolute;
  width: 50px;
  height: 50px;
  animation: ${moveAnimation} ${props => props.speed}s linear;
  animation-fill-mode: forwards;
  --startX: ${props => props.startX}px;
  --startY: ${props => props.startY}px;
  --endX: ${props => props.endX}px;
  --endY: ${props => props.endY}px;
`;

const ScoreBoard = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 24px;
  color: white;
  z-index: 10;
`;

const GameOverScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  z-index: 20;
`;

interface Stone {
  id: number;
  type: number;
  speed: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const Content = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stones, setStones] = useState<Stone[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [stoneIdCounter, setStoneIdCounter] = useState(0);

  const handleStartClick = () => {
    setIsPlaying(true);
    setScore(0);
    setGameOver(false);
    setDifficulty(1);
    setStones([]);
    setStoneIdCounter(0);
  };

  const spawnStone = useCallback((): Stone => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const startPosition = Math.floor(Math.random() * 4);
    let startX: number, startY: number, endX: number, endY: number;
  
    switch (startPosition) {
      case 0: // Top
        startX = Math.random() * screenWidth;
        startY = -50;
        endX = Math.random() * screenWidth;
        endY = screenHeight + 50;
        break;
      case 1: // Right
        startX = screenWidth + 50;
        startY = Math.random() * screenHeight;
        endX = -50;
        endY = Math.random() * screenHeight;
        break;
      case 2: // Bottom
        startX = Math.random() * screenWidth;
        startY = screenHeight + 50;
        endX = Math.random() * screenWidth;
        endY = -50;
        break;
      case 3: // Left
        startX = -50;
        startY = Math.random() * screenHeight;
        endX = screenWidth + 50;
        endY = Math.random() * screenHeight;
        break;
      default:
        startX = 0;
        startY = 0;
        endX = screenWidth;
        endY = screenHeight;
    }
  
    // Randomize stone type with weighted probabilities
    const typeRandom = Math.random();
    let type;
    if (typeRandom < 0.4) type = 0;
    else if (typeRandom < 0.7) type = 1;
    else if (typeRandom < 0.9) type = 2;
    else type = 3;

    // Randomize speed within a range based on difficulty
    const baseSpeed = 5 - difficulty * 0.5;
    const speedVariation = Math.random() * 2 - 1; // -1 to 1
    const speed = baseSpeed + speedVariation;

    const newStone: Stone = {
      id: stoneIdCounter,
      type,
      speed: Math.max(1, speed), // Ensure minimum speed of 1
      startX,
      startY,
      endX,
      endY,
    };
  
    setStoneIdCounter(prev => prev + 1);
    
    return newStone;
  }, [difficulty, stoneIdCounter]);

  const handleStoneTap = useCallback((id: number, type: number) => {
    if (type === 3) { // Bomb (stone4)
      setGameOver(true);
    } else {
      setScore(prev => prev + 1);
      setStones(prev => prev.filter(stone => stone.id !== id));
    }
  }, []);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const spawnInterval = setInterval(() => {
        setStones(prev => {
          const maxStones = Math.floor(10 + difficulty * 2); // Increase max stones with difficulty
          if (prev.length < maxStones) {
            const stonesToAdd = Math.floor(Math.random() * 3) + 1; // Add 1-3 stones at a time
            const newStones = Array.from({ length: stonesToAdd }, () => spawnStone());
            return [...prev, ...newStones];
          }
          return prev;
        });
      }, 500 + Math.random() * 1000); // Random spawn interval between 500ms and 1500ms

      const difficultyInterval = setInterval(() => {
        setDifficulty(prev => {
          const increase = Math.random() * 0.2 + 0.1; // Random difficulty increase
          return Math.min(3, prev + increase); // Cap at 3
        });
      }, 15000 + Math.random() * 10000); // Random difficulty change between 15-25 seconds

      return () => {
        clearInterval(spawnInterval);
        clearInterval(difficultyInterval);
      };
    }
  }, [isPlaying, gameOver, difficulty, spawnStone]);

  return (
    <StyledContent>
      <ScoreBoard className="scoreboard">
        Score: {score}  Difficulty: {difficulty.toFixed(1)}
      </ScoreBoard>
      {!isPlaying && (
        <StartButton
          src={startImage}
          alt="Start"
          onClick={handleStartClick}
          isClicked={isPlaying}
        />
      )}
      {isPlaying && !gameOver && stones.map(stone => (
        <Stone
          key={`stone-${stone.id}-${Math.random()}`}
          id={`stone-${stone.id}`}
          src={[stone1, stone2, stone3, stone4][stone.type]}
          alt={`Stone ${stone.type + 1}`}
          speed={stone.speed}
          startX={stone.startX}
          startY={stone.startY}
          endX={stone.endX}
          endY={stone.endY}
          onClick={() => handleStoneTap(stone.id, stone.type)}
        />
      ))}
      {gameOver && (
        <GameOverScreen>
          <h2>Game Over</h2>
          <p>Your score: {score}</p>
          <button onClick={handleStartClick}>Play Again</button>
        </GameOverScreen>
      )}
    </StyledContent>
  );
};

export default Content;