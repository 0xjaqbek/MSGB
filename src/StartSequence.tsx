import React from 'react';
import styled from 'styled-components';
import stone1 from '../src/assets/stone1.svg';
import blastImage from '../src/assets/blast.svg';
import blastImage0 from '../src/assets/blast0.svg';
import blastImage1 from '../src/assets/blast1.svg';

const AnimatedImage = styled.img`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30vh;
  z-index: 100;
`;

// Hidden preload container
const PreloadContainer = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  z-index: -1;
`;

interface StartSequenceProps {
  onComplete: () => void;
  isAnimating: boolean;
}

const StartSequence: React.FC<StartSequenceProps> = ({ onComplete, isAnimating }) => {
  const [currentImage, setCurrentImage] = React.useState<string>('stone1');
  
  React.useEffect(() => {
    if (!isAnimating) return;
    
    const sequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentImage('blast');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentImage('blast0');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentImage('blast1');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      onComplete();
    };
    
    sequence();
  }, [isAnimating, onComplete]);

  const getImage = () => {
    switch(currentImage) {
      case 'stone1':
        return stone1;
      case 'blast':
        return blastImage;
      case 'blast0':
        return blastImage0;
      case 'blast1':
        return blastImage1;
      default:
        return stone1;
    }
  };

  return (
    <>
      {/* Preload all images */}
      <PreloadContainer>
        <img src={stone1} alt="preload" />
        <img src={blastImage} alt="preload" />
        <img src={blastImage0} alt="preload" />
        <img src={blastImage1} alt="preload" />
      </PreloadContainer>
      
      <AnimatedImage src={getImage()} alt="animation" />
    </>
  );
};

export default StartSequence;