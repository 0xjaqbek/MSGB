import "./App.scss";
import styled from "styled-components";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./Content";
import { useState } from "react";

const StyledApp = styled.div`
  max-width: 100vw;
  min-height: 100vh;
`;

interface LandingPageProps {
  $fadeOut: boolean;
  $hidden: boolean;
}

const LandingPage = styled.div<LandingPageProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: white;
  text-align: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  opacity: ${props => props.$fadeOut ? 0 : 1};
  visibility: ${props => props.$hidden ? 'hidden' : 'visible'};
  transition: opacity 1s ease-in-out, visibility 1s ease-in-out;

  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease-out;
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    animation: fadeInUp 1s ease-out 0.3s backwards;
  }

  button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    background: transparent;
    border: 2px solid white;
    color: white;
    cursor: pointer;
    border-radius: 25px;
    transition: all 0.3s ease;
    animation: fadeInUp 1s ease-out 0.6s backwards;

    &:hover {
      background: white;
      color: black;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

function App() {
  const { network } = useTonConnect();
  const [showLanding, setShowLanding] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  const handleEnterClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      setHidden(true);
      setShowLanding(false);
    }, 1000);
  };

  return (
    <StyledApp>
      {/* Background animation */}
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>

      {/* Landing Page */}
      {showLanding && (
        <LandingPage $fadeOut={fadeOut} $hidden={hidden}>
          <h1>Welcome to Your App</h1>
          <p>Enter to explore the amazing features</p>
          <button onClick={handleEnterClick}>Enter App</button>
        </LandingPage>
      )}

      {/* Foreground content */}
      <Content />
    </StyledApp>
  );
}

export default App;