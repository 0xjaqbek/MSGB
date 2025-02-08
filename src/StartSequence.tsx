import React from 'react';
import styled from 'styled-components';
import stone1 from '../src/assets/stone1.svg';
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

interface StartSequenceProps {
  onComplete: () => void;
  isAnimating: boolean;
}

const StartSequence: React.FC<StartSequenceProps> = ({ onComplete, isAnimating }) => {
  const [currentImage, setCurrentImage] = React.useState<string>('stone1');
  
  React.useEffect(() => {
    if (!isAnimating) return;
    
    const sequence = async () => {
      // Wait 200ms, then show blast.svg
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentImage('blast');
      
      // Wait 200ms, then show blast0.svg
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentImage('blast0');
      
      // Wait 200ms, then show blast1.svg
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentImage('blast1');
      
      // Wait 200ms, then complete
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
      case 'blast0':
        return blastImage0;
      case 'blast1':
        return blastImage1;
      default:
        return stone1;
    }
  };

  return <AnimatedImage src={getImage()} alt="animation" />;
};

export default StartSequence;