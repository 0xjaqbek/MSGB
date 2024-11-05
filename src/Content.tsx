import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes, css } from 'styled-components';
import { StyledContent, BlinkScreen, StartButton, Stone, Blast, ScoreBoard, WelcomeInfo, GameOverScreen } from './components/StyledComponents';
import startImage from './assets/start.png';
import stone1 from './assets/stone1.png';
import stone2 from './assets/stone2.png';
import stone3 from './assets/stone3.png';
import stone4 from './assets/stone4.png';
import blastImage0 from './assets/blast0.png'; 
import blastImage1 from './assets/blast1.png'; 
import { getDatabase, ref, set, onValue, push, update, get } from 'firebase/database';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { trackUserVisit, updatePlayCount, type VisitStats } from './userTracking';

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


interface UserVisit {
  lastVisit: string;
  currentStreak: number;
  highestStreak: number;
  totalVisits: number;  // Renamed from visits to be more clear
  dailyVisits: { [key: string]: number };  // Track visits per day
  firstVisitComplete: boolean;
}

interface VisitHistoryEntry {
  timestamp: string;
  userName: string;
  streak: number;
}

const PlaysInfoContainer = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #88c8ff;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(136, 200, 255, 0.5);
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem 1rem;
  border-radius: 15px;
  z-index: 1000;
`;

// New interfaces for plays tracking
interface UserPlays {
  playsToday: number;
  maxPlaysToday: number;
  lastPlayDate: string;
}

const calculateMaxPlays = (streak: number): number => {
  return 5 + (streak - 1); // 5 base plays + bonus from streak
};

export const getUserVisitStats = async (userId: string): Promise<UserVisit | null> => {
  const db = getDatabase();
  const userVisitsRef = ref(db, `users/${userId}/visits`);
  
  try {
    const snapshot = await get(userVisitsRef);
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.val() as UserVisit;
  } catch (error) {
    console.error('Error getting user visit stats:', error);
    throw error;
  }
};

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
  const [playsRemaining, setPlaysRemaining] = useState<number | null>(null);
  const [maxPlaysToday, setMaxPlaysToday] = useState<number>(5);
  const [userStreak, setUserStreak] = useState<number>(1);

  // Add function to get and update plays
  const getPlaysInfo = useCallback(async (userId: string) => {
    const db = getDatabase();
    const playsRef = ref(db, `users/${userId}/plays`);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const snapshot = await get(playsRef);
      const userData = snapshot.val() as UserPlays || {
        playsToday: 0,
        maxPlaysToday: calculateMaxPlays(userStreak),
        lastPlayDate: today
      };

      if (userData.lastPlayDate !== today) {
        // Reset plays for new day
        userData.playsToday = 0;
        userData.maxPlaysToday = calculateMaxPlays(userStreak);
        userData.lastPlayDate = today;
      }

      await set(playsRef, userData);
      setPlaysRemaining(userData.maxPlaysToday - userData.playsToday);
      setMaxPlaysToday(userData.maxPlaysToday);
      return userData;
    } catch (error) {
      console.error('Error getting plays info:', error);
      return null;
    }
  }, [userStreak]);

  const updatePlaysCount = useCallback(async (userId: string) => {
    const db = getDatabase();
    const playsRef = ref(db, `users/${userId}/plays`);
    
    try {
      const snapshot = await get(playsRef);
      const userData = snapshot.val() as UserPlays;
      const newPlaysCount = userData.playsToday + 1;
      
      if (newPlaysCount > userData.maxPlaysToday) {
        return false;
      }
      
      await set(playsRef, {
        ...userData,
        playsToday: newPlaysCount
      });
      
      setPlaysRemaining(userData.maxPlaysToday - newPlaysCount);
      return true;
    } catch (error) {
      console.error('Error updating plays count:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const initTelegram = async () => {
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
          const userVisitsRef = ref(getDatabase(), `users/${user.id}/visits`);
          const snapshot = await get(userVisitsRef);
          const userData = snapshot.val();
          if (userData) {
            setUserStreak(userData.currentStreak || 1);
          }
          await getPlaysInfo(user.id.toString());
        }

        tg.MainButton.text = "Start Game";
        tg.MainButton.onClick(() => handleStartClick());
        tg.MainButton.show();
      }
    };

    initTelegram();
  }, [getPlaysInfo]);

  const handleStartClick = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user?.id) return;
  
    try {
      const remainingPlays = await updatePlayCount(tg.initDataUnsafe.user.id.toString());
      
      if (remainingPlays < 0) {
        alert("No plays remaining today. Come back tomorrow for more!");
        return;
      }
  
      setIsPlaying(true);
      setScore(0);
      setGameOver(false);
      setDifficulty(1);
      setCurrentStones([]);
      setStoneIdCounter(0);
      setRemainingTime(GAME_DURATION);
      window.Telegram?.WebApp?.MainButton.hide();
      window.Telegram?.WebApp?.sendData(JSON.stringify({ action: 'gameStarted' }));
    } catch (error) {
      console.error('Error starting game:', error);
      alert("There was an error starting the game. Please try again.");
    }
  };
  
  const [userVisitStats, setUserVisitStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    const loadUserStats = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        try {
          const stats = await trackUserVisit(
            tg.initDataUnsafe.user.id.toString(),
            tg.initDataUnsafe.user.first_name
          );
          setUserVisitStats(stats);
        } catch (error) {
          console.error('Error loading user stats:', error);
        }
      }
    };

    loadUserStats();
  }, []);
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
      setDifficulty((prevDifficulty) => prevDifficulty + 0.03); // Gradually increase difficulty
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
    const baseSpeed = 4 - difficulty * 0.3;  // Increase speed as difficulty increases
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
        const isVertical = Math.random() < 0.5; // 50% chance for vertical stones
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

const formatDate = (timestamp: string | number | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // Formats the date to a human-readable format
};

const database = getDatabase(app);
// Function to update the score in Realtime Database
const updateScore = useCallback(async () => {
  try {
    const playerId = telegramUser?.id.toString() || 'anonymous'; 
    const userName = telegramUser?.first_name.toString() || 'anonymous'; 
    const playerScoresRef = ref(database, `/${playerId}/scores`);
    const timestamp = Date.now(); // Use Date.now() as the key
    const formattedTimestamp = formatDate(timestamp); // Store formatted timestamp in the data

    // Add the new score to the array
    await update(playerScoresRef, {
      [timestamp]: {  // Use timestamp (number) as key, not the formatted string
        userName,
        score,
        remainingTime,
        timestamp: formattedTimestamp,  // Store the human-readable timestamp
      }
    });

    console.log('Score updated successfully!');
  } catch (error) {
    console.error('Error updating score:', error);
  }
}, [score, remainingTime, telegramUser, database]);

return (
  <StyledContent>
    {/* Existing blast effect */}
    {showBlast && blastPosition && (
      <Blast 
        key={currentBlastImage}
        src={currentBlastImage} 
        posX={blastPosition.posX} 
        posY={blastPosition.posY} 
      />
    )}
    
    {/* Blink effect */}
    <BlinkScreen isVisible={showBlink} />

    {!isPlaying && telegramUser && userVisitStats && (
  <WelcomeInfo className="scoreboard">
    <div style={{ 
      position: 'absolute', 
      top: '-60px', 
      left: '50%', 
      transform: 'translateX(-50%)',
      color: '#88c8ff',
      textAlign: 'center',
      fontSize: '1.2rem',
      textShadow: '0 0 10px rgba(136, 200, 255, 0.5)',
      background: 'rgba(0, 0, 0, 0.6)',
      padding: '0.5rem 1rem',
      borderRadius: '15px',
    }}>
      <div>🎮 {userVisitStats.playsRemaining} of {userVisitStats.maxPlaysToday} plays remaining</div>
      {userVisitStats.currentStreak > 1 && (
        <div style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
          +{userVisitStats.currentStreak - 1} bonus {userVisitStats.currentStreak - 1 === 1 ? 'play' : 'plays'} from streak!
        </div>
      )}
    </div>
  </WelcomeInfo>
)}

    {/* Rest of your existing JSX */}
    {!isPlaying && !telegramUser && (
      <WelcomeInfo className="scoreboard">
        Welcome<br></br>in
      </WelcomeInfo>
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
        onClick={() => handleStoneTap(stone.id, stone.type, stone.posX!, stone.posY!)}
        onAnimationEnd={() => setCurrentStones((prev) => prev.filter((s) => s.id !== stone.id))}
      />
    ))}

    {gameOver && (
      <GameOverScreen className="scoreboard1">
        <h2>Game Over</h2>
        {playsRemaining === 0 && (
          <div style={{ fontSize: '1rem', marginTop: '1rem', color: '#88c8ff' }}>
            No plays remaining today.<br />Come back tomorrow for more!
          </div>
        )}
      </GameOverScreen>
    )}
  </StyledContent>
);
};

export default Content;