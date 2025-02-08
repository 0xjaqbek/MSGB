import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes, css } from 'styled-components';
import { StyledContent, BlinkScreen, Stone, Blast, ScoreBoard, WelcomeInfo, GameOverScreen } from './components/StyledComponents';
import stone1 from './assets/stone1.svg';
import stone2 from './assets/stone2.svg';
import stone3 from './assets/stone3.svg';
import stone4 from './assets/stone4.svg';
import blastImage0 from './assets/blast0.svg'; 
import blastImage1 from './assets/blast1.svg'; 
import { getDatabase, ref, set, onValue, push, update, get } from 'firebase/database';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { trackUserVisit, updatePlayCount, type VisitStats } from './userTracking';
import EndGamePage from "./EndGamePage";
import StartAdventureButton from './components/StartAdventureButton';
import StartSequence from "./StartSequence";

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
          color: string;
          textColor: string;
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

interface ContentProps {
  onGameStateChange: (isPlaying: boolean) => void;
}


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

const Content: React.FC<ContentProps> = ({ onGameStateChange }) => {
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
  const [currentBlastImage, setCurrentBlastImage] = useState<string>(blastImage0);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [playsRemaining, setPlaysRemaining] = useState<number | null>(null);
  const [maxPlaysToday, setMaxPlaysToday] = useState<number>(5);
  const [userStreak, setUserStreak] = useState<number>(1);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [showEndGame, setShowEndGame] = useState(false);
  const [endGameReason, setEndGameReason] = useState<'no-plays' | 'game-over'>('game-over');
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [isStartAnimating, setIsStartAnimating] = useState(false);

  const getTotalPoints = async (playerId: string) => {
    const db = getDatabase();
    const playerScoresRef = ref(db, `/${playerId}/scores`);
    
    try {
      const snapshot = await get(playerScoresRef);
      if (!snapshot.exists()) {
        return 0;
      }
      
      const scores = snapshot.val();
      return Object.values(scores).reduce((total: number, entry: any) => {
        return total + (entry.score || 0);
      }, 0);
    } catch (error) {
      console.error('Error getting total points:', error);
      return 0;
    }
  };

  useEffect(() => {
    const initApp = async () => {
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
          try {
            const stats = await trackUserVisit(user.id.toString(), user.first_name);
            setVisitStats(stats);
            setPlaysRemaining(stats.playsRemaining);
            setMaxPlaysToday(stats.maxPlaysToday);
            setUserStreak(stats.currentStreak);
            const points = await getTotalPoints(user.id.toString());
            setTotalPoints(points);
          } catch (error) {
            console.error('Error loading user stats:', error);
          }
        }
      }
    };
    
    initApp();

    // Add event listener for alternative game start methods
    const startGameHandler = async () => {
      if (!telegramUser?.id) return;
  
      try {
        const remainingPlays = await updatePlayCount(telegramUser.id.toString());
        
        if (remainingPlays < 0) {
          setEndGameReason('no-plays');
          setShowEndGame(true);
          return;
        }
  
        setPlaysRemaining(remainingPlays);
        setIsStartAnimating(true);
      } catch (error) {
        console.error('Error starting game:', error);
        alert("There was an error starting the game. Please try again.");
      }
    };

    window.addEventListener('start-game', startGameHandler);

    // Cleanup the event listener
    return () => {
      window.removeEventListener('start-game', startGameHandler);
    };
  }, [telegramUser]);

  useEffect(() => {
    onGameStateChange(isPlaying);
  }, [isPlaying, onGameStateChange]);

  const handleStartClick = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user?.id) return;
  
    setIsStartAnimating(true); // Start animation
  };
  
  const handleAnimationComplete = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user?.id) return;
  
    try {
      const remainingPlays = await updatePlayCount(tg.initDataUnsafe.user.id.toString());
      
      if (remainingPlays < 0) {
        setEndGameReason('no-plays');
        setShowEndGame(true);
        return;
      }
  
      setPlaysRemaining(remainingPlays);
      setIsPlaying(true);
      setScore(0);
      setGameOver(false);
      setDifficulty(1);
      setCurrentStones([]);
      setStoneIdCounter(0);
      setRemainingTime(GAME_DURATION);
  
      try {
        tg.MainButton.hide();
        tg.sendData(JSON.stringify({ action: 'gameStarted' }));
      } catch (telegramError) {
        console.warn('Telegram UI operation failed:', telegramError);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert("There was an error starting the game. Please try again.");
    }
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
      setDifficulty((prevDifficulty) => prevDifficulty + 0.03); // Gradually increase difficulty
    }, 1000); // Reduce time every second

    return () => clearInterval(timer);
  }
}, [isPlaying, gameOver]);


useEffect(() => {
  if (gameOver) {
    setIsPlaying(false);
    setEndGameReason('game-over');
    setShowEndGame(true);
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.MainButton.text = "Play Again";
      tg.MainButton.show();
      updateScore();
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
      setScore(prev => prev - 10); // Subtract 10 points
      setBlastPosition({ posX, posY });
      setCurrentBlastImage(blastImage0);
      setShowBlast(true);
      navigator.vibrate([100, 50, 100]); // Different vibration pattern for penalty

      setTimeout(() => {
        setCurrentBlastImage(blastImage1);
      }, 100);

      setTimeout(() => {
        setShowBlast(false);
      }, 200);
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

      setScore(prev => prev + 1);
    }
    
    setCurrentStones((prevStones) => prevStones.filter((stone) => stone.id !== id));
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
    const timestamp = Date.now();
    const formattedTimestamp = formatDate(timestamp);

    await update(playerScoresRef, {
      [timestamp]: {
        userName,
        score,
        remainingTime,
        timestamp: formattedTimestamp,
      }
    });

    // Update total points after adding new score
    const newTotal = await getTotalPoints(playerId);
    setTotalPoints(newTotal);

    console.log('Score updated successfully!');
  } catch (error) {
    console.error('Error updating score:', error);
  }
}, [score, remainingTime, telegramUser, database]);

const PlaysInfoContainer = styled.div`
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  color: #0FF;
  text-align: center;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(136, 200, 255, 0.5);
  background: rgba(0, 0, 0, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 15px;
  z-index: 1001;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const handleShare = () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.sendData(JSON.stringify({ 
      action: 'share', 
      score: endGameReason === 'game-over' ? score : undefined 
    }));
  }
};

const handleClose = () => {
  setShowEndGame(false);
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.MainButton.text = "Start Game";
    tg.MainButton.show();
  }
};

return (
  <StyledContent>
    {showEndGame ? (
      <EndGamePage
        reason={endGameReason}
        score={endGameReason === 'game-over' ? score : undefined}
        playsFromStreak={userStreak > 1 ? userStreak - 1 : 0}
        onShare={handleShare}
        onClose={handleClose}
      />
    ) : (
      <>
        {showBlast && blastPosition && (
          <Blast 
            key={currentBlastImage}
            src={currentBlastImage} 
            posX={blastPosition.posX} 
            posY={blastPosition.posY} 
          />
        )}
        
        <BlinkScreen isVisible={showBlink} />

        {!isPlaying && telegramUser && visitStats && (


          <PlaysInfoContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tickets Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '0.9rem'  // Smaller white text
                }}>
                  Tickets left
                </div>
                <div style={{ 
                  color: '#0FF',      // Original cyan color
                  fontSize: '1.6rem'  // Slightly bigger than label
                }}>
                  {playsRemaining}/{maxPlaysToday}
                </div>
              </div>

              {/* Coin Balance Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '0.9rem'  // Smaller white text
                }}>
                  Coin Balance
                </div>
                <div style={{ 
                  color: '#FFD700',   // Gold color
                  fontSize: '2rem'  // Bigger than tickets value
                }}>
                  {totalPoints}
                </div>
              </div>

              {/* Streak Bonus if applicable */}
              {userStreak > 1 && (
                <div style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  +{userStreak - 1} bonus {userStreak - 1 === 1 ? 'ticket' : 'tickets'} from streak!
                </div>
              )}
            </div>
          </PlaysInfoContainer>
        )}

        {!isPlaying && !isStartAnimating && (
          <img 
            src={stone1} 
            alt="Stone"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '30vh',
              zIndex: 50
            }}
          />
        )}

        {isStartAnimating && !isPlaying && (
          <StartSequence 
            onComplete={handleAnimationComplete} 
            isAnimating={isStartAnimating}
          />
        )}

        {!isPlaying && telegramUser && (
          <WelcomeInfo className="scoreboard">
            {/* Empty for spacing */}
          </WelcomeInfo>
        )}

        {!isPlaying && !telegramUser && (
          <WelcomeInfo className="scoreboard">
            Welcome<br/>in
          </WelcomeInfo>
        )}

        {!isPlaying && !isStartAnimating && (
          <StartAdventureButton onClick={handleStartClick} />
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
          </GameOverScreen>
        )}
      </>
    )}
  </StyledContent>
)};

export default Content;
