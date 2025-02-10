// ProgressBar.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const ProgressBarContainer = styled.div`
  position: fixed;
  top: 20vh;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 1000;
`;

const SVGContainer = styled.div`
  width: 90%; // Adjust this value to change the width of the progress bar
  max-width: 317px;
`;

interface ProgressBarProps {
  duration: number;
  isPlaying: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ duration, isPlaying }) => {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    if (!isPlaying) {
      setProgress(1);
      return;
    }

    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.max(0, 1 - elapsedTime / (duration * 1000));
      setProgress(newProgress);

      if (newProgress > 0 && isPlaying) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [duration, isPlaying]);

  return (
    <ProgressBarContainer>
      <SVGContainer>
        <svg width="100%" height="15" viewBox="0 0 317 15" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <mask id="progress-mask">
              <rect x="0" y="0" width={317 * progress} height="15" fill="white" />
            </mask>
            <linearGradient id="paint0_linear_175_6050" x1="0" y1="7.85483" x2="317" y2="7.85483" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00FFFF" stopOpacity="0"/>
              <stop offset="0.429022" stopColor="#A86DFF"/>
              <stop offset="0.700315" stopColor="#A86DFF"/>
              <stop offset="1" stopColor="#F4B92E"/>
            </linearGradient>
            <linearGradient id="paint1_linear_175_6050" x1="0" y1="7.85483" x2="317" y2="7.85483" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00FFFF" stopOpacity="0"/>
              <stop offset="0.429022" stopColor="#A86DFF"/>
              <stop offset="0.700315" stopColor="#A86DFF"/>
              <stop offset="1" stopColor="#F4B92E"/>
            </linearGradient>
          </defs>
          <g mask="url(#progress-mask)">
            <rect y="0.854828" width="317" height="14" rx="7" fill="url(#paint0_linear_175_6050)"/>
            <rect x="0.5" y="1.35483" width="316" height="13" rx="6.5" fill="url(#paint1_linear_175_6050)" stroke="#00FFFF"/>
          </g>
        </svg>
      </SVGContainer>
    </ProgressBarContainer>
  );
};

export default ProgressBar;