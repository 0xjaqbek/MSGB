import React, { useEffect } from 'react';
import { useGameLogic } from '@hooks/useGameLogic';
import { GAME_DURATION, STONE_IMAGES, BLAST_IMAGES, START_IMAGE } from '@constants/constants';
import { StyledContent, BlinkScreen, StartButton, Stone, Blast, ScoreBoard, WelcomeInfo, GameOverScreen } from './StyledComponents';
import { Stone as StoneType, TelegramUser } from '../types/types';

const Game: React.FC = () => {
  const {
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
  } = useGameLogic();

  // Telegram WebApp initialization
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes();
      tg.setHeaderColor("#000000");
      tg.setBottomBarColor("#000000");
      
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }

      tg.MainButton.text = "Start Game";
      tg.MainButton.onClick(() => handleStartClick());
      tg.MainButton.show();
    }
  }, []);

  // Game timer and difficulty
  useEffect(() => {
    if (isPlaying && !gameOver) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            setGameOver(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPlaying, gameOver]);

  // Stone spawning
  useEffect(() => {
    if (isPlaying && !gameOver) {
      const spawnInterval = setInterval(() => {
        const isVertical = Math.random() < 0.5;
        const newStone = spawnStone(isVertical ? 'vertical' : 'horizontal');
        setCurrentStones(prev => [...prev, newStone]);
      }, 500);

      return () => clearInterval(spawnInterval);
    }
  }, [isPlaying, gameOver, spawnStone]);

  // Game over handling
  useEffect(() => {
    if (gameOver) {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.MainButton.text = "Play Again";
        tg.MainButton.show();
        updateScore();
        tg.sendData(JSON.stringify({ action: 'gameOver', score }));
      }
    }
  }, [gameOver, score, updateScore]);

  return (
    <StyledContent>
      {showBlast && blastPosition && (
        <Blast 
          key={currentBlastImage}
          src={currentBlastImage}
          posX={blastPosition.posX}
          posY={blastPosition.posY}
        />
      )}
      
      <BlinkScreen isVisible={showBlink} />

      {!isPlaying && telegramUser && (
        <WelcomeInfo>
          Welcome<br />{telegramUser.first_name}<br />in<br />
        </WelcomeInfo>
      )}
      
      {!isPlaying && !telegramUser && (
        <WelcomeInfo>
          Welcome<br />in
        </WelcomeInfo>
      )}
      
      {!isPlaying && (
        <StartButton
          src={START_IMAGE}
          alt="Start"
          onClick={handleStartClick}
          isClicked={isPlaying}
        />
      )}
      
      {isPlaying && (
        <ScoreBoard>
          Score: {score} LVL: {difficulty.toFixed(1)} Time: {remainingTime}s
        </ScoreBoard>
      )}

      {isPlaying && !gameOver && currentStones.map((stone) => (
        <Stone
          key={`stone-${stone.id}`}
          id={`stone-${stone.id}`}
          src={STONE_IMAGES[`stone${stone.type + 1}` as keyof typeof STONE_IMAGES]}
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
        <GameOverScreen>
          <h2>Game Over</h2>
        </GameOverScreen>
      )}
    </StyledContent>
  );
};

export default Game;