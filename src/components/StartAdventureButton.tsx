import React from 'react';

interface StartAdventureButtonProps {
  onClick: () => void;
}

const StartAdventureButton: React.FC<StartAdventureButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        bg-transparent border-2 border-cyan-400 text-cyan-400
        px-8 py-3 rounded-lg
        shadow-[0_0_15px_rgba(0,255,255,0.3)]
        hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]
        transition-all duration-300
        flex flex-col items-center
        font-rem"
    >
      <span className="text-lg">Start</span>
      <span className="text-lg">Adventure</span>
    </button>
  );
};

export default StartAdventureButton;