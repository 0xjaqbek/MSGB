interface EndGamePageProps {
    reason: 'no-plays' | 'game-over';
    score?: number;
    nextPlayTime?: string; // Time until next play is available
    playsFromStreak?: number;
    onShare?: () => void;
    onClose?: () => void;
  }
  
  const EndGamePage: React.FC<EndGamePageProps> = ({ 
    reason, 
    score, 
    nextPlayTime = "tomorrow",
    playsFromStreak = 0,
    onShare,
    onClose 
  }) => {
    return (
      <div className="page-container">
        <div className="card text-center">
          <h1 className="text-glow text-2xl mb-4">
            {reason === 'game-over' ? 'Game Over!' : 'No Plays Remaining'}
          </h1>
          
          {reason === 'game-over' && score !== undefined && (
            <div className="mb-6">
              <p className="text-3xl text-glow mb-2">{score}</p>
              <p className="text-info">Final Score</p>
            </div>
          )}
          
          {reason === 'no-plays' && (
            <div className="space-y-4 mb-6">
              <div className="text-glow text-lg">
                Come back {nextPlayTime} for more plays!
              </div>
              <div className="stat-row bg-blue-900/20 rounded-lg">
                <span className="text-info">Next Reset:</span>
                <span className="text-value">Tomorrow at 00:00</span>
              </div>
            </div>
          )}
  
          <div className="card bg-blue-900/20 p-4 mb-6">
            <h3 className="text-lg text-glow mb-3">Get More Plays!</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>🔥 Build your streak</span>
                <span className="text-glow">+1 play/day</span>
              </div>
              <div className="flex items-center justify-between">
                <span>👥 Invite friends</span>
                <span className="text-glow">+2 plays/friend</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🎯 Complete tasks</span>
                <span className="text-glow">+1 play/task</span>
              </div>
            </div>
          </div>
  
          <div className="space-y-3">
            <button
              onClick={onShare}
              className="w-full p-3 rounded-lg bg-blue-500/20 border border-blue-400/30 
                       hover:bg-blue-500/30 transition-all duration-300 text-glow"
            >
              Share with Friends
            </button>
            <button
              onClick={onClose}
              className="w-full p-3 rounded-lg bg-transparent border border-blue-400/30 
                       hover:bg-blue-500/20 transition-all duration-300 text-info"
            >
              Back to Menu
            </button>
          </div>
        </div>
  
        {playsFromStreak > 0 && (
          <div className="card mt-4 text-center bg-blue-900/20">
            <div className="text-glow">
              <span className="text-lg">🎉 Streak Bonus!</span>
              <p className="mt-2">You get +{playsFromStreak} extra {playsFromStreak === 1 ? 'play' : 'plays'}</p>
              <p className="text-sm text-info mt-1">Keep your streak for more bonuses!</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default EndGamePage;