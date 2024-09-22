import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes, css } from 'styled-components';
import { StyledContent, BlinkScreen, StartButton, Stone, Blast, ScoreBoard, WelcomeInfo, GameOverScreen } from './StyledComponents.';
import startImage from './start.png';
import stone1 from './stone1.png';
import stone2 from './stone2.png';
import stone3 from './stone3.png';
import stone4 from './stone4.png';
import blastImage0 from './blast0.png'; 
import blastImage1 from './blast1.png'; 


interface Stone {
  id: number;
  type: number;
  speed: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  posX?: number;
  posY?: number;
  direction: 'horizontal' | 'vertical';
}

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes: () => void;
        setHeaderColor: (color: string) => void;
        setBottomBarColor: (color: string) => void;
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        MainButton: {
          text: string;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        sendData: (data: string) => void;
      };
    };
  }
}


const Content: React.FC = () => {
  const [showBlink, setShowBlink] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentStones, setCurrentStones] = useState<Stone[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [stoneIdCounter, setStoneIdCounter] = useState(0);
  const [rocksToNextLevel, setRocksToNextLevel] = useState(5);
  const [showBlast, setShowBlast] = useState(false);
  const [blastPosition, setBlastPosition] = useState<{ posX: number; posY: number } | null>(null);
  const [currentBlastImage, setCurrentBlastImage] = useState<string>(blastImage0);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes();
      tg.setHeaderColor("#000000");
      tg.setBottomBarColor("#000000");
      const user = tg.initDataUnsafe?.user;
      
      if (user) {
        setTelegramUser(user);
      }

      // Set up Telegram's main button
      tg.MainButton.text = "Start Game";
      tg.MainButton.onClick(() => handleStartClick());
      tg.MainButton.show();
    }
  }, []);

  const handleStartClick = () => {
    setIsPlaying(true);
    setScore(0);
    setGameOver(false);
    setDifficulty(1);
    setCurrentStones([]);
    setStoneIdCounter(0);
    setRocksToNextLevel(5);

    // Hide Telegram's main button when the game starts
    window.Telegram?.WebApp?.MainButton.hide();

    // Notify Telegram that the game has started
    window.Telegram?.WebApp?.sendData(JSON.stringify({ action: 'gameStarted' }));
  };


  const spawnStone = useCallback((direction: 'horizontal' | 'vertical'): Stone => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let startX, endX, startY, endY, posX, posY;

    if (direction === 'horizontal') {
      const startLeft = Math.random() < 0.5;
      startX = startLeft ? -500 : screenWidth;
      endX = startLeft ? screenWidth : -screenWidth;
      posY = Math.random() * (screenHeight - 50);
    } else {
      // Only allow stones to move from top to bottom
      startY = -500;
      endY = screenHeight;
      posX = Math.random() * (screenWidth - 50);
    }
  
    const typeRandom = Math.random();
    let type;
    // Adjusted probabilities to make stone4 more frequent
    if (typeRandom < 0.3) type = 0;      // 30% chance
    else if (typeRandom < 0.55) type = 1; // 25% chance
    else if (typeRandom < 0.75) type = 2; // 20% chance
    else type = 3;                        // 25% chance (game over stone)

    // Adjust speed calculation based on difficulty
    const baseSpeed = 4 - difficulty * 0.3; // Adjust this factor to control speed increase
    const speed = Math.max(0.5, baseSpeed); // Ensure speed doesn't go below a minimum value

    const newStone: Stone = {
      id: stoneIdCounter,
      type,
      speed,
      startX,
      endX,
      startY,
      endY,
      posX,
      posY,
      direction,
    };
  
    setStoneIdCounter(prev => prev + 1);
    
    return newStone;
  }, [difficulty, stoneIdCounter]);

  const handleStoneTap = useCallback((id: number, type: number, posX: number, posY: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  
    if (type === 3) {
      setGameOver(true);
      setShowBlink(true);
      setTimeout(() => setShowBlink(false), 800);
    } else {
      setBlastPosition({ posX, posY });
      setCurrentBlastImage(blastImage0);
      setShowBlast(true);

      setTimeout(() => {
        setCurrentBlastImage(blastImage1);
      }, 50);

      setTimeout(() => {
        setShowBlast(false);
      }, 100);

  
      setScore((prev) => {
        const newScore = prev + 1;
        setRocksToNextLevel((prevRocks) => {
          if (prevRocks === 1) {
            setDifficulty((prevDifficulty) => Math.min(5, prevDifficulty + 0.1));
            return 5;
          }
          return prevRocks - 1;
        });
        return newScore;
      });
      setCurrentStones((prevStones) => prevStones.filter((stone) => stone.id !== id));
    }
  }, []);
  

  useEffect(() => {
    if (isPlaying && !gameOver) {
      const spawnNewStone = () => {
        const isVertical = Math.random() < 0.5; // 70% chance for vertical stones
        const newStone = spawnStone(isVertical ? 'vertical' : 'horizontal');
        setCurrentStones(prev => [...prev, newStone]);
      };

      const spawnInterval = setInterval(spawnNewStone, 500); // Spawn a stone every 500ms
      

      return () => {
        clearInterval(spawnInterval);
      };
    }
  }, [isPlaying, gameOver, spawnStone]);

  useEffect(() => {
    if (gameOver) {
      // Show Telegram's main button when the game is over
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.MainButton.text = "Play Again";
        tg.MainButton.show();

        // Send the final score to Telegram
        tg.sendData(JSON.stringify({ action: 'gameOver', score }));
      }
    }
  }, [gameOver, score]);

return (
  <StyledContent>
{/* Blast effect */}
{showBlast && blastPosition && (
        <Blast 
          key={currentBlastImage} // Force re-render when image changes
          src={currentBlastImage} 
          posX={blastPosition.posX} 
          posY={blastPosition.posY} 
        />
      )}
    {/* Blink effect */}
    <BlinkScreen isVisible={showBlink} />

    {!isPlaying && telegramUser && (
      <WelcomeInfo className="scoreboard">
        Welcome<br></br> {telegramUser.first_name}<br />in<br />
      </WelcomeInfo>
    )}
    {!isPlaying && !telegramUser && (
      <WelcomeInfo className="scoreboard">
        Welcome<br></br>in
      </WelcomeInfo>
    )}
    {!isPlaying && (
      <StartButton
        src={startImage}
        alt="Start"
        onClick={handleStartClick}
        isClicked={isPlaying}
      />
    )}
    {isPlaying && (
      <ScoreBoard className="scoreboard">
        Score: {score}  LVL: {difficulty.toFixed(1)}  Next: {rocksToNextLevel}
      </ScoreBoard>
    )}
{isPlaying && !gameOver && currentStones.map((stone) => (
    <Stone
      key={`stone-${stone.id}`}
      id={`stone-${stone.id}`}
      src={[stone1, stone2, stone3, stone4][stone.type]}
      alt={`Stone ${stone.type + 1}`}
      speed={stone.speed}
      startX={stone.startX}
      endX={stone.endX}
      startY={stone.startY}
      endY={stone.endY}
      posX={stone.posX}
      posY={stone.posY}
      direction={stone.direction}
      onClick={() => handleStoneTap(stone.id, stone.type, stone.posX!, stone.posY!)}  // Pass the stone's position
      onAnimationEnd={() => setCurrentStones((prev) => prev.filter((s) => s.id !== stone.id))}
    />
  ))}

    {gameOver && (
      <>
        <GameOverScreen className="scoreboard1">
          <h2>Game Over</h2>
        </GameOverScreen>
      </>
    )}
  </StyledContent>
)};

export default Content;