
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
import { getDatabase, ref, set, onValue, push, update } from 'firebase/database';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyCKp8N8YnO81Vns0PIlVPGg-tBGjnlYcxE",
  authDomain: "moonstones-8e2e4.firebaseapp.com",
  databaseURL: "https://moonstones-8e2e4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "moonstones-8e2e4",
  storageBucket: "moonstones-8e2e4.appspot.com",
  messagingSenderId: "645616414210",
  appId: "1:645616414210:web:236885687711d65c45011b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



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

const GAME_DURATION = 60; // 60 seconds for the game

const Content: React.FC = () => {
  const [showBlink, setShowBlink] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentStones, setCurrentStones] = useState<Stone[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [stoneIdCounter, setStoneIdCounter] = useState(0);
  const [remainingTime, setRemainingTime] = useState(GAME_DURATION); // Time remaining in seconds
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
    setRemainingTime(GAME_DURATION); // Reset time to 60 seconds
    window.Telegram?.WebApp?.MainButton.hide();
    window.Telegram?.WebApp?.sendData(JSON.stringify({ action: 'gameStarted' }));
  };

// Timer logic to reduce time by 1 second every interval and increase difficulty
useEffect(() => {
  if (isPlaying && !gameOver) {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          setGameOver(true); // End game if time is up
          return 0;
        }
        return prevTime - 1;
      });

      // Increase difficulty over time
      setDifficulty((prevDifficulty) => prevDifficulty + 0.01); // Gradually increase difficulty
    }, 1000); // Reduce time every second

    return () => clearInterval(timer);
  }
}, [isPlaying, gameOver]);


  useEffect(() => {
    if (gameOver) {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.MainButton.text = "Play Again";
        tg.MainButton.show();
        tg.sendData(JSON.stringify({ action: 'gameOver', score }));
      }
    }
  }, [gameOver, score]);

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
      startY = -500;
      endY = screenHeight;
      posX = Math.random() * (screenWidth - 50);
    }
  
    const typeRandom = Math.random();
    let type;
    if (typeRandom < 0.3) type = 0;      
    else if (typeRandom < 0.55) type = 1; 
    else if (typeRandom < 0.75) type = 2; 
    else type = 3;
  
    // Adjust speed calculation based on increasing difficulty
    const baseSpeed = 4 - difficulty * 0.2;  // Increase speed as difficulty increases
    const speed = Math.max(0.5, baseSpeed);  // Ensure minimum speed limit
  
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
  
    setStoneIdCounter((prev) => prev + 1);
  
    return newStone;
  }, [difficulty, stoneIdCounter]);

  const handleStoneTap = useCallback((id: number, type: number, posX: number, posY: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  
    if (type === 3) {
      setGameOver(true);
      setShowBlink(true);
      setTimeout(() => setShowBlink(false), 5000);
      navigator.vibrate(200);
    } else {
      setBlastPosition({ posX, posY });
      setCurrentBlastImage(blastImage0);
      setShowBlast(true);

      setTimeout(() => {
        setCurrentBlastImage(blastImage1);
      }, 100);

      setTimeout(() => {
        setShowBlast(false);
      }, 200);

  
      setScore((prev) => {
        const newScore = prev + 1;
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
        updateScore();
        // Send the final score to Telegram
        tg.sendData(JSON.stringify({ action: 'gameOver', score }));
      }
    }
}, [gameOver, score]);

const database = getDatabase(app);
// Function to update the score in Realtime Database
const updateScore = useCallback(async () => {
  try {
    const playerId = telegramUser?.id.toString() || 'anonymous'; 
    const playerScoresRef = ref(database, `scores/${playerId}`);

    // Add the new score to the array
    await update(playerScoresRef, {
      [Date.now()]: { // Use timestamp as key for each score
        score,
        remainingTime,
        timestamp: Date.now(),
      }
    });

    console.log('Score updated successfully!');
  } catch (error) {
    console.error('Error updating score:', error);
  }
}, [score, remainingTime, telegramUser, database]);




return (
  <StyledContent>
          <div className="top-bar"></div>
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
          Score: {score}  LVL: {difficulty.toFixed(1)}  Time: {remainingTime}s
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
          <div className="bottom-bar"></div>
  </StyledContent>
)};

export default Content;