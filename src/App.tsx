import "./App.scss";
import styled from "styled-components";
import { useTonConnect } from "./hooks/useTonConnect";
import "@twa-dev/sdk";
import Content from "./components/Game"; 

const StyledApp = styled.div`
  max-width: 100vw;
  min-height: 100vh;

`;

function App() {
  const { network } = useTonConnect();

  return (
    <StyledApp>

      {/* Background animation */}
      <div className="bg-animation">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div id="stars4"></div>
      </div>

      {/* Foreground content */}
      <Content />
    </StyledApp>
  );
}

export default App;