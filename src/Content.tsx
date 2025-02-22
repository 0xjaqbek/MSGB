import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes, css } from 'styled-components';
import { StyledContent, BlinkScreen, Stone, Blast, ScoreBoard, WelcomeInfo, GameOverScreen } from './components/StyledComponents';
import stone1 from './assets/stone1.svg';
import stone2 from './assets/stone2.svg';
import stone3 from './assets/stone3.svg';
import stone4 from './assets/stone4.svg';
import stoneA from './assets/stoneA.svg';
import stoneB from './assets/stoneB.svg';
import stoneC from './assets/stoneC.svg';
import stoneD from './assets/stoneD.svg';
import stoneE from './assets/stoneE.svg';
import stoneF from './assets/stoneF.svg';
import blastImage0 from './assets/blast0.svg'; 
import blastImage1 from './assets/blast1.svg'; 
import { getDatabase, ref, set, onValue, push, update, get, increment } from 'firebase/database';
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
import { handleGameOver } from "./gameOverHandler";
import { getNextFriendBonusInfo } from './ticketManagement';



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
  type: number | string;
  speed: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  posX?: number;
  posY?: number;
  direction: 'horizontal' | 'vertical';
  isDistractor?: boolean;
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

const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
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

const DISTRACTOR_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'];

const getStoneImage = (type: number | string): string => {
  const stoneMap: Record<string, string> = {
    '0': stone1,
    '1': stone2,
    '2': stone3,
    '3': stone4,
    'A': stoneA,
    'B': stoneB,
    'C': stoneC,
    'D': stoneD,
    'E': stoneE,
    'F': stoneF
  };
  return stoneMap[type.toString()] || stone1;
};

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
  const [friendsCount, setFriendsCount] = useState(0);

    useEffect(() => {
    const fetchFriendsCount = async () => {
      if (!telegramUser) return;

      try {
        const db = getDatabase();
        const friendsRef = ref(db, `users/${telegramUser.id}/friends`);
        const snapshot = await get(friendsRef);
        
        if (snapshot.exists()) {
          setFriendsCount(Object.keys(snapshot.val()).length);
        }
      } catch (error) {
        console.error('Error fetching friends count:', error);
      }
    };

    fetchFriendsCount();
  }, [telegramUser]);

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
            const db = getDatabase();
            const userRef = ref(db, `users/${user.id}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val() || {};
    
            const maxTickets = await calculateAvailableTickets(user.id.toString());
            const stats = await trackUserVisit(user.id.toString(), user.first_name);
            
            setVisitStats(stats);
            setMaxPlaysToday(maxTickets);
            setPlaysRemaining(maxTickets - (stats.playsToday || 0));
            setUserStreak(stats.currentStreak);
            setTotalPoints(userData.totalScore || 0); // Directly use totalScore field
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
        const maxTickets = await calculateAvailableTickets(telegramUser.id.toString());
        const visitsSnapshot = await get(ref(database, `users/${telegramUser.id}/visits`));
        const currentPlays = visitsSnapshot.val()?.playsToday || 0;

        if (currentPlays >= maxTickets) {
          setEndGameReason('no-plays');
          setShowEndGame(true);
          return;
        }

        setPlaysRemaining(maxTickets - currentPlays);
        setIsStartAnimating(false);
        setIsPlaying(true);
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
      const visitsSnapshot = await get(ref(database, `users/${userId}/visits`));
      const currentPlays = visitsSnapshot.val()?.playsToday || 0;

      if (currentPlays >= maxTickets) {
        setEndGameReason('no-plays');
        setShowEndGame(true);
        return;
      }

      setMaxPlaysToday(maxTickets);
      setPlaysRemaining(maxTickets - currentPlays);
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

  // Determine if this should be a distractor (30% chance)
  const isDistractor = Math.random() < 0.3;
  
  let type: number | string;
  if (isDistractor) {
    // Select random distractor type (A-F)
    type = DISTRACTOR_TYPES[Math.floor(Math.random() * DISTRACTOR_TYPES.length)];
  } else {
    // Select scoring stone type based on weights
    const random = Math.random();
    if (random < STONE_CONFIGS[3].weight) type = 3;
    else if (random < STONE_CONFIGS[3].weight + STONE_CONFIGS[2].weight) type = 2;
    else if (random < STONE_CONFIGS[3].weight + STONE_CONFIGS[2].weight + STONE_CONFIGS[1].weight) type = 1;
    else type = 0;
  }

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
    isDistractor
  };

  setStoneIdCounter((prev) => prev + 1);
  return newStone;
}, [difficulty, stoneIdCounter]);

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
  setCurrentBlastImage(blastImage0);
  setShowBlast(true);

  setTimeout(() => {
    setCurrentBlastImage(blastImage1);
  }, 100);

  setTimeout(() => {
    setShowBlast(false);
  }, 200);
  
  // Remove the stone
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

// Single consolidated gameOver effect
useEffect(() => {
  if (gameOver) {
    const processGameOver = async () => {
      const finalScore = score;
      setIsPlaying(false);
      setEndGameReason('game-over');
      
      try {
        await handleGameOver({
          score: finalScore,
          remainingTime,
          telegramUser,
          visitStats,
          maxPlaysToday
        }, {
          onGameOver,
          onNavigateToFriends
        });

        // Get remaining tickets from the correct path
        if (telegramUser) {
          const db = getDatabase();
          const playsRef = ref(db, `users/${telegramUser.id}/plays/remaining`);
          const snapshot = await get(playsRef);
          const remainingTickets = snapshot.val() || 0;
          
          setPlaysRemaining(remainingTickets); // Update local state
          
          setShowEndGame(true);
        }
      } catch (error) {
        console.error('Error in game over process:', error);
      }
    };

    processGameOver();
  }
}, [gameOver]);

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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1rem;
  pointer-events: none;
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
                fontSize: '0.9rem'
              }}>
                Tickets left
              </div>
              <div style={{ 
                color: '#0FF',
                fontSize: '1.6rem'
              }}>
                {playsRemaining}/{maxPlaysToday}
              </div>
            </div>

            {/* Coin Balance Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ 
                color: 'white', 
                fontSize: '0.9rem'
              }}>
                Coin Balance
              </div>
              <div style={{ 
                color: '#FFD700',
                fontSize: '2rem'
              }}>
                {totalPoints}
              </div>
            </div>

            {/* Bonuses or How to Get More Tickets */}
            {userStreak > 1 || 
            (visitStats?.ticketsFromInvites && visitStats.ticketsFromInvites > 0) || 
            (telegramUser && friendsCount > 0) ? (
              <>
                {userStreak > 1 && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
                    +{userStreak - 1} bonus {userStreak - 1 === 1 ? 'ticket' : 'tickets'} from streak!
                  </div>
                )}
                {visitStats?.ticketsFromInvites && visitStats.ticketsFromInvites > 0 && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#FFD700' }}>
                    +{visitStats.ticketsFromInvites} permanent {visitStats.ticketsFromInvites === 1 ? 'ticket' : 'tickets'} from invites!
                  </div>
                )}
                {telegramUser && friendsCount > 0 && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#FFD700' }}>
                    {(() => {
                      const friendBonusInfo = getNextFriendBonusInfo(friendsCount);
                      return friendBonusInfo.currentBonusTickets > 0
                        ? `+${friendBonusInfo.currentBonusTickets} bonus ticket${friendBonusInfo.currentBonusTickets !== 1 ? 's' : ''} from friends!`
                        : `${friendBonusInfo.friendsForNextBonus} more friend${friendBonusInfo.friendsForNextBonus !== 1 ? 's' : ''} for first bonus ticket!`;
                    })()}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#fff' }}>
                  Get more tickets:
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#0FF' }}>
                  • Invite friends (+1 permanent)
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#FFD700' }}>
                  • Daily streak (+1 per day)
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#FFD700' }}>
                  • Add friends (+1 per 2 friends)
                </div>
              </>
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
                src={getStoneImage(stone.type)}
                alt={`Stone ${typeof stone.type === 'string' ? stone.type : stone.type + 1}`}
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