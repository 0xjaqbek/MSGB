import { useState, useEffect, useCallback } from 'react';
import { Stone, TelegramUser } from '../types/types';
import { GAME_DURATION, BLAST_IMAGES } from '../constants/constants';
import { database } from '../config/firebaseConfig';
import { ref, update } from 'firebase/database';
import { formatDate } from '../config/firebaseConfig';

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

  const updateScore = useCallback(async () => {
    try {
      const playerId = telegramUser?.id.toString() || 'anonymous';
      const userName = telegramUser?.first_name.toString() || 'anonymous';
      const playerScoresRef = ref(database, `/${playerId}/scores`);
      const timestamp = Date.now();
      
      await update(playerScoresRef, {
        [timestamp]: {
          userName,
          score,
          remainingTime,
          timestamp: formatDate(timestamp),
        }
      });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  }, [score, remainingTime, telegramUser]);

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

  const handleStoneTap = useCallback((id: number, type: number, posX: number, posY: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  
    if (type === 3) { // Stone type 4 (index 3)
      setScore((prev) => prev - 10); // Allow negative points
      setBlastPosition({ posX, posY });
      setCurrentBlastImage(BLAST_IMAGES.blast0);
      setShowBlast(true);
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setTimeout(() => {
        setCurrentBlastImage(BLAST_IMAGES.blast1);
      }, 100);

      setTimeout(() => {
        setShowBlast(false);
      }, 200);
    } else {
      setBlastPosition({ posX, posY });
      setCurrentBlastImage(BLAST_IMAGES.blast0);
      setShowBlast(true);

      setTimeout(() => {
        setCurrentBlastImage(BLAST_IMAGES.blast1);
      }, 100);

      setTimeout(() => {
        setShowBlast(false);
      }, 200);

      setScore((prev) => prev + 1);
    }
    
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
    updateScore,
    setIsPlaying,
    setRemainingTime 
  };
};