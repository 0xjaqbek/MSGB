import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import startImage from './start.png';
import stone1 from './stone1.png';
import stone2 from './stone2.png';
import stone3 from './stone3.png';
import stone4 from './stone4.png';

const moveAnimation = keyframes`
  0% {
    transform: translateX(var(--startX));
  }
  100% {
    transform: translateX(var(--endX));
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
  font-family: 'Lato', sans-serif;
  background: -webkit-linear-gradient(white, #38495a);
  -webkit-background-clip: text;

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

const Stone = styled.img<{ speed: number; startX: number; endX: number; posY: number }>`
  position: absolute;
  width: 50px;
  height: 50px;
  animation: ${moveAnimation} ${props => props.speed}s linear;
  animation-fill-mode: forwards;
  --startX: ${props => props.startX}px;
  --endX: ${props => props.endX}px;
  top: ${props => props.posY}px;
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
  background-color: rgba(0, 0, 0, 0.7);
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
  endX: number;
  posY: number;
}

const Content = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentStone, setCurrentStone] = useState<Stone | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [stoneIdCounter, setStoneIdCounter] = useState(0);

  const handleStartClick = () => {
    setIsPlaying(true);
    setScore(0);
    setGameOver(false);
    setDifficulty(1);
    setCurrentStone(null);
    setStoneIdCounter(0);
  };

  const spawnStone = useCallback((): Stone => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const startLeft = Math.random() < 0.5;
    const startX = startLeft ? -50 : screenWidth;
    const endX = startLeft ? screenWidth : -50;
    
    const posY = Math.random() * (screenHeight - 50);
  
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
      endX,
      posY,
    };
  
    setStoneIdCounter(prev => prev + 1);
    
    return newStone;
  }, [difficulty, stoneIdCounter]);

  const handleStoneTap = useCallback((type: number) => {
    if (type === 3) { // Bomb (stone4)
      setGameOver(true);
    } else {
      setScore(prev => prev + 1);
      setCurrentStone(null);
    }
  }, []);

  useEffect(() => {
    if (isPlaying && !gameOver && !currentStone) {
      const spawnTimeout = setTimeout(() => {
        setCurrentStone(spawnStone());
      }, 500 + Math.random() * 100); // Random spawn delay between 500ms and 1500ms

      return () => clearTimeout(spawnTimeout);
    }
  }, [isPlaying, gameOver, currentStone, spawnStone]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const difficultyInterval = setInterval(() => {
        setDifficulty(prev => {
          const increase = Math.random() * 0.2 + 0.2; // Random difficulty increase
          return Math.min(3, prev + increase); // Cap at 3
        });
      }, 5000 + Math.random() * 2000); // Random difficulty change between 15-25 seconds

      return () => clearInterval(difficultyInterval);
    }
  }, [isPlaying, gameOver]);

  return (
    <StyledContent>
      <ScoreBoard className="scoreboard">
        Score: {score}
      </ScoreBoard>
      {!isPlaying && (
        <StartButton
          src={startImage}
          alt="Start"
          onClick={handleStartClick}
          isClicked={isPlaying}
        />
      )}
      {isPlaying && !gameOver && currentStone && (
        <Stone
          key={`stone-${currentStone.id}`}
          id={`stone-${currentStone.id}`}
          src={[stone1, stone2, stone3, stone4][currentStone.type]}
          alt={`Stone ${currentStone.type + 1}`}
          speed={currentStone.speed}
          startX={currentStone.startX}
          endX={currentStone.endX}
          posY={currentStone.posY}
          onClick={() => handleStoneTap(currentStone.type)}
          onAnimationEnd={() => setCurrentStone(null)}
        />
      )}
      {gameOver && (
        <GameOverScreen>
          <h2>Game Over<br></br>Radioactive Rock!</h2>
          <p>Your score: {score}</p>
          <button onClick={handleStartClick}>Play Again</button>
        </GameOverScreen>
      )}
    </StyledContent>
  );
};

export default Content;