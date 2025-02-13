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
import NebulaEffect from './components/NebulaEffect';
import hudTop from './assets/HUDtop.svg';
import ProgressBar from './ProgressBar';
import pointsBg from './assets/points.svg';
import { calculateAvailableTickets } from './ticketManagement';

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
  photo_url?: string;
};

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
  userStats?: {
    currentStreak: number;
    highestStreak: number;
    totalVisits: number;
    todayVisits: number;
    isFirstVisit: boolean;
    playsRemaining: number;
  } | null;
  onGameOver?: (score: number) => void;  // Move this out of userStats
  onNavigateToFriends?: () => void;      // Move this out of userStats
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

const Content: React.FC<ContentProps> = ({ 
  onGameStateChange, 
  userStats, 
  onGameOver,
  onNavigateToFriends 
}) => {
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

// Add this useEffect to fetch and update total points
useEffect(() => {
  const fetchTotalPoints = async () => {
    if (telegramUser) {
      try {
        const points = await getTotalPoints(telegramUser.id.toString());
        setTotalPoints(points);
      } catch (error) {
        console.error('Error fetching total points:', error);
      }
    }
  };

  fetchTotalPoints();
}, [telegramUser]);

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
        if ('requestFullscreen' in tg) {
          (tg as any).requestFullscreen();
        }
        tg.disableVerticalSwipes();
        tg.setHeaderColor("#000000");
        tg.setBottomBarColor("#000000");
  
        const user = tg.initDataUnsafe?.user;
        if (user) {
          setTelegramUser(user);
          try {
            const maxTickets = await calculateAvailableTickets(user.id.toString());
            const stats = await trackUserVisit(user.id.toString(), user.first_name);
            setVisitStats(stats);
            setMaxPlaysToday(maxTickets);
            setPlaysRemaining(maxTickets - (stats.playsToday || 0));
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
        setIsStartAnimating(false); // Make sure animation is off
        setIsPlaying(true);  // Start the game immediately
        setScore(0);
        setGameOver(false);
        setDifficulty(1);
        setCurrentStones([]);
        setStoneIdCounter(0);
        setRemainingTime(GAME_DURATION);

        const tg = window.Telegram?.WebApp;
        if (tg) {
          tg.MainButton.hide();
          tg.sendData(JSON.stringify({ action: 'gameStarted' }));
        }
      } catch (error) {
        console.error('Error starting game:', error);
        alert("There was an error starting the game. Please try again.");
      }
    };

    window.addEventListener('start-game', startGameHandler);

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
      const userId = tg.initDataUnsafe.user.id.toString();
      const maxTickets = await calculateAvailableTickets(userId);
      const remainingPlays = await updatePlayCount(userId);
      
      if (remainingPlays < 0) {
        setEndGameReason('no-plays');
        setShowEndGame(true);
        return;
      }
  
      setMaxPlaysToday(maxTickets);
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

// Single consolidated gameOver effect
useEffect(() => {
  if (gameOver) {
    const handleGameOver = async () => {
      setIsPlaying(false);
      setEndGameReason('game-over');
      setShowEndGame(true);
      
      // Update score once
      await updateScore();
      
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.MainButton.text = "Play Again";
        tg.MainButton.hide();
        tg.sendData(JSON.stringify({ action: 'gameOver', score }));
      }

      // Call onGameOver callback
      onGameOver?.(score);
      
      // Navigate to friends if no plays remaining
      if (userStats?.playsRemaining === 0) {
        onNavigateToFriends?.();
      }
    };

    handleGameOver();
  }
}, [gameOver, score, updateScore, onGameOver, onNavigateToFriends, userStats?.playsRemaining]);


const PlaysInfoContainer = styled.div`
  position: absolute;
  top: 7%;
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

const HUDTop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background: url(${hudTop}) no-repeat center top;
  background-size: 100vw;
  width: 100vw;
  aspect-ratio: 412 / 172;
  pointer-events: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
`;

const ProfileContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-left: 10px;
  margin-bottom: 20px; // Use margin-bottom instead of padding
`;

const ProfilePicture = styled.img`
  width: 6vh;
  height: 6vh;
  border: 1px solid #0FF;
  border-radius: 10px;
  object-fit: cover;
`;

const UserName = styled.div`
  color: #0FF;
  font-size: 0.8rem;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  margin-bottom: 7px; // Slight adjustment to align with profile picture
`;

const TotalPointsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 5px;
  margin-bottom: 25px;
`;

const TotalPointsLabel = styled.div`
  color: #0FF;
  font-size: 0.8rem;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  margin-right: 5px;
`;

const TotalPointsValue = styled.div`
  color: white;
  font-size: 1rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
`;

const MoonstoneTitle = styled.div`
  color: white;
  font-size: 1rem;
  padding-top: 30px;
  padding-left: 8px;
  text-align: center;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

const PointsDisplay = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 202px; // Adjust based on your SVG size
  height: 70px; // Adjust based on your SVG size
  background-image: url(${pointsBg});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PointsText = styled.span`
  color: white;
  font-size: 1.4rem;
  font-weight: bold;
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
    tg.MainButton.hide();
  }
};

const handlePlayAgain = () => {
  setShowEndGame(false);
  const event = new CustomEvent('start-game');
  window.dispatchEvent(event);
};

return (
  <StyledContent>
        {showEndGame ? (
          <EndGamePage
            reason={endGameReason}
            score={endGameReason === 'game-over' ? score : undefined}
            ticketsLeft={userStats?.playsRemaining || 0}
            onPlayAgain={handlePlayAgain}
            onShare={handleShare}
            onClose={handleClose}
            onNavigateToFriends={onNavigateToFriends} // Add this line
          />
        ) : (
      <>
        {isPlaying && <NebulaEffect />}  {/* Add this line */}
        
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
              <>
              <HUDTop>
                <MoonstoneTitle>MOONSTONES</MoonstoneTitle>
                <ProfileContainer>
                  {telegramUser?.photo_url ? (
                    <ProfilePicture 
                      src={telegramUser.photo_url} 
                      alt={`${telegramUser.first_name}'s profile`} 
                    />
                  ) : (
                    <ProfilePicture 
                      as="div" 
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,255,255,0.2)'
                      }}
                    >
                      {telegramUser?.first_name?.[0] || '?'}
                    </ProfilePicture>
                  )}
                  <UserName>{telegramUser?.first_name}</UserName>
                </ProfileContainer>
                <TotalPointsContainer>
                  <TotalPointsLabel>TOTAL POINTS:</TotalPointsLabel>
                  <TotalPointsValue>{totalPoints}</TotalPointsValue>
                </TotalPointsContainer>
              </HUDTop>
              <ProgressBar duration={GAME_DURATION} isPlaying={isPlaying} />
              <PointsDisplay>
                <PointsText>{score}</PointsText>
              </PointsDisplay>
              </>
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
