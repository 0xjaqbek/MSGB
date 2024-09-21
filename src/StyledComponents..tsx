// StyledComponents.ts
import styled, { keyframes, css } from "styled-components";


// Animations
export const blinkAnimation = keyframes`
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
`;

export const moveHorizontalAnimation = keyframes`
  0% { transform: translateX(var(--startX)); }
  100% { transform: translateX(var(--endX)); }
`;

export const moveVerticalAnimation = keyframes`
  0% { transform: translateY(var(--startY)); }
  100% { transform: translateY(var(--endY)); }
`;

export const imageAnimation = keyframes`
  0% { transform: scale(1) translateY(0); }
  50% { transform: scale(0.95) translateY(3%); }
  100% { transform: scale(1) translateY(0); }
`;

// Styled components
export const StyledContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  touch-action: none;
  font-family: 'Lato';
  background: -webkit-linear-gradient(white, #38495a);
  -webkit-background-clip: text;
`;

export const BlinkScreen = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  opacity: 0;
  pointer-events: none;
  z-index: 500;
  ${({ isVisible }) => isVisible && css`animation: ${blinkAnimation} 0.5s ease-out;`}
`;

export const StartButton = styled.img<{ isClicked: boolean }>`
  width: 75vw;
  cursor: pointer;
  ${({ isClicked }) => isClicked
    ? css`display: none;`
    : css`animation: ${imageAnimation} 2s infinite;`}
`;

export const Stone = styled.img<{
  speed: number;
  direction: 'horizontal' | 'vertical';
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  posX?: number;
  posY?: number;
}>`
  position: absolute;

  // Generate a random size factor between 0.5 and 1.5
  width: ${() => `${Math.random() * (1.5 - 0.5) + 0.5} * 5vh`};
  height: ${() => `${Math.random() * (1.5 - 0.5) + 0.5} * 5vh`};

  animation: ${props =>
    props.direction === 'horizontal' ? moveHorizontalAnimation : moveVerticalAnimation}
    ${props => props.speed}s linear;
  animation-fill-mode: forwards;

  ${props =>
    props.direction === 'horizontal'
      ? css`
          --startX: ${props.startX}px;
          --endX: ${props.endX}px;
          top: ${props.posY}px;
        `
      : css`
          --startY: ${props.startY}px;
          --endY: ${props.endY}px;
          left: ${props.posX}px;
        `}
`;

export const Blast = styled.img<{ posX: number; posY: number }>`
  position: absolute;
  width: 15vh;
  height: 15vh;
  left: ${(props) => props.posX}px;
  top: ${(props) => props.posY}px;
  pointer-events: none;
`;

export const ScoreBoard = styled.div`
  position: absolute;
  top: 5px;
  left: 10px;
  font-size: 14px;
  color: white;
  z-index: 10;
`;

export const WelcomeInfo = styled.div`
  position: absolute;
  top: 20%;
  left: 50%;
  font-family: 'Lato';
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: white;
  text-align: center;
  z-index: 10;
`;

export const GameOverScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.9);
  padding: 5px;
  text-align: center;
  z-index: 400;
`;
