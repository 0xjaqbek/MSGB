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
  font-family: 'Lato';
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
  width: 20vh;
  height: 20vh;
  animation: ${moveAnimation} ${props => props.speed}s linear;
  animation-fill-mode: forwards;
  --startX: ${props => props.startX}px;
  --endX: ${props => props.endX}px;
  top: ${props => props.posY}px;
`;

const ScoreBoard = styled.div`
  position: absolute;
  top: 5px;
  left: 10px;
  font-size: 14px;
  color: white;
  z-index: 10;
`;

const GameOverScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.9);
  padding: 5px;
  text-align: center;
  z-index: 400;
`;

const GameOverScreen1 = styled.div`
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  z-index: 400;
`;

const FlatButton = styled.button`
  background-color: grey;
  color: white;
  border: none;
  padding: 10px 20px;
  font-family: 'Lato';
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #2980b9;
  }

  &:active {
    background-color: #2473a7;
    transform: translateY(1px);
  }
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
  const [rocksToNextLevel, setRocksToNextLevel] = useState(5);

  const handleStartClick = () => {
    setIsPlaying(true);
    setScore(0);
    setGameOver(false);
    setDifficulty(1);
    setCurrentStone(null);
    setStoneIdCounter(0);
    setRocksToNextLevel(5);
  };

  const spawnStone = useCallback((): Stone => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const startLeft = Math.random() < 0.5;
    const startX = startLeft ? -500 : screenWidth;
    const endX = startLeft ? screenWidth : -screenWidth;
    
    const posY = Math.random() * (screenHeight - 50);
  
    const typeRandom = Math.random();
    let type;
    if (typeRandom < 0.4) type = 0;
    else if (typeRandom < 0.7) type = 1;
    else if (typeRandom < 0.9) type = 2;
    else type = 3;

    const baseSpeed = 5 - difficulty * 0.3;
    const speedVariation = Math.random() * 0.5;
    const speed = baseSpeed + speedVariation;

    const newStone: Stone = {
      id: stoneIdCounter,
      type,
      speed: Math.max(0.5, speed),
      startX,
      endX,
      posY,
    };
  
    setStoneIdCounter(prev => prev + 1);
    
    return newStone;
  }, [difficulty, stoneIdCounter]);

  const handleStoneTap = useCallback((type: number) => {
    if (type === 3) {
      setGameOver(true);
    } else {
      setScore(prev => {
        const newScore = prev + 1;
        setRocksToNextLevel(prevRocks => {
          if (prevRocks === 1) {
            setDifficulty(prevDifficulty => Math.min(5, prevDifficulty + 0.1));
            return 5;
          }
          return prevRocks - 1;
        });
        return newScore;
      });
      setCurrentStone(null);
    }
  }, []);

  useEffect(() => {
    if (isPlaying && !gameOver && !currentStone) {
      const spawnTimeout = setTimeout(() => {
        setCurrentStone(spawnStone());
      }, 200 + Math.random() * 300);

      return () => clearTimeout(spawnTimeout);
    }
  }, [isPlaying, gameOver, currentStone, spawnStone]);

  return (
    <StyledContent>
      <ScoreBoard className="scoreboard">
        Score: {score}  LVL: {difficulty.toFixed(1)}  Next: {rocksToNextLevel}
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
        <>
          <GameOverScreen className="scoreboard1">
            <h2>Game Over</h2>
          </GameOverScreen>
          <GameOverScreen1>
          <FlatButton onClick={handleStartClick}>Play Again</FlatButton>
          </GameOverScreen1>
        </>
      )}
    </StyledContent>
  );
};

export default Content;