import { getDatabase, ref, update, increment } from 'firebase/database';
import { TelegramUser } from './types';

interface GameOverParams {
  score: number;
  remainingTime: number;
  telegramUser: TelegramUser | null;
  visitStats: {
    playsToday: number;
  } | null;
  maxPlaysToday: number;
}

interface GameOverCallbacks {
  onGameOver?: (score: number) => void;
  onNavigateToFriends?: () => void;
}

export const handleGameOver = async (
  params: GameOverParams,
  callbacks: GameOverCallbacks
): Promise<void> => {
  const { score, remainingTime, telegramUser, visitStats, maxPlaysToday } = params;
  const { onGameOver, onNavigateToFriends } = callbacks;

  // Prevent processing if no user
  if (!telegramUser?.id) {
    console.error('No player ID available');
    return;
  }

  try {
    const playerId = telegramUser.id.toString();
    const db = getDatabase();
    const playerRef = ref(db, `users/${playerId}`);
    const timestamp = Date.now();

    // Single atomic update for all changes
    const updates = {
      [`scores/${timestamp}`]: {
        userName: telegramUser.first_name,
        score,
        remainingTime,
        timestamp: new Date(timestamp).toLocaleString()
      },
      totalScore: increment(score),
      lastPlayed: timestamp,
      lastScore: score,
      'visits/playsToday': increment(1),
      'plays/remaining': increment(-1)
    };

    // Perform atomic update
    await update(playerRef, updates);

    // Handle callbacks
    onGameOver?.(score);
    
    // Check if this was the last play
    const updatedPlaysToday = (visitStats?.playsToday || 0) + 1;
    if (updatedPlaysToday >= maxPlaysToday) {
      onNavigateToFriends?.();
    }

    // Update Telegram UI
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.MainButton.text = "Play Again";
      tg.MainButton.hide();
      tg.sendData(JSON.stringify({ action: 'gameOver', score }));
    }

  } catch (error) {
    console.error('Error handling game over:', error);
    throw error;
  }
};