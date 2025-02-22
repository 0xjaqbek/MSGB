import { useState, useEffect, useCallback } from 'react';
import { Stone, TelegramUser } from '../types/types';
import { GAME_DURATION, BLAST_IMAGES } from '../constants/constants';
import { database } from '../config/firebaseConfig';
import { increment, ref, update } from 'firebase/database';
import { formatDate } from '../config/firebaseConfig';

// Add iOS detection
const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

// Stone configuration for scoring
interface StoneConfig {
  weight: number;
  points: number;
}

const STONE_CONFIGS: Record<number, StoneConfig> = {
  0: { weight: 0.7, points: 1 },   // Most common (stone1)
  1: { weight: 0.15, points: 2 },  // ~4 times per play (stone2)
  2: { weight: 0.1, points: 4 },   // ~2 times per play (stone3)
  3: { weight: 0.05, points: 6 }   // Rarest (stone4)
};

export const useGameLogic = () => {
  const [showBlink, setShowBlink] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentStones, setCurrentStones] = useState<Stone[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [stoneIdCounter, setStoneIdCounter] = useState(0);
  const [remainingTime, setRemainingTime] = useState(GAME_DURATION);
  const [showBlast, setShowBlast] = useState(false);
  const [blastPosition, setBlastPosition] = useState<{ posX: number; posY: number } | null>(null);
  const [currentBlastImage, setCurrentBlastImage] = useState<string>(BLAST_IMAGES.blast0);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  // Add constants for blast images
  const { blast0, blast1 } = BLAST_IMAGES;

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
  
    const baseSpeed = 4 - difficulty * 0.3;
    const speed = Math.max(0.5, baseSpeed);
  
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

  const handleStartClick = () => {
    setIsPlaying(true);
    setScore(0);
    setGameOver(false);
    setDifficulty(1);
    setCurrentStones([]);
    setStoneIdCounter(0);
    setRemainingTime(GAME_DURATION);
    window.Telegram?.WebApp?.MainButton.hide();
    window.Telegram?.WebApp?.sendData(JSON.stringify({ action: 'gameStarted' }));
  };

  const handleStoneTap = useCallback((id: number, type: number | string, posX: number, posY: number) => {
    // Ignore taps on distractor stones (A-F)
    if (typeof type === 'string') {
      setCurrentStones((prevStones) => prevStones.filter((stone) => stone.id !== id));
      return;
    }
  
    // Handle scoring stones
    if (navigator.vibrate && !isIOS()) {
      navigator.vibrate(50);
    }
  
    // Calculate points based on stone type
    const points = STONE_CONFIGS[type]?.points || 1;
    setScore(prev => prev + points);
    
    // Visual feedback
    setBlastPosition({ posX, posY });
    setCurrentBlastImage(blast0);
    setShowBlast(true);
  
    setTimeout(() => {
      setCurrentBlastImage(blast1);
    }, 100);
  
    setTimeout(() => {
      setShowBlast(false);
    }, 200);
    
    // Remove the stone
    setCurrentStones((prevStones) => prevStones.filter((stone) => stone.id !== id));
  }, []);

  return {
    showBlink,
    isPlaying,
    score,
    gameOver,
    currentStones,
    difficulty,
    remainingTime,
    showBlast,
    blastPosition,
    currentBlastImage,
    telegramUser,
    setTelegramUser,
    handleStartClick,
    handleStoneTap,
    spawnStone,
    setCurrentStones,
    setGameOver,
    setIsPlaying,
    setRemainingTime 
  };
};