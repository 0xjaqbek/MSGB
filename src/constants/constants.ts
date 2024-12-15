import stone1 from '@assets/stone1.svg';
import stone2 from '@assets/stone2.svg';
import stone3 from '@assets/stone3.svg';
import stone4 from '@assets/stone4.svg';
import blastImage0 from '@assets/blast0.svg';
import blastImage1 from '@assets/blast1.svg';
import startImage from '@assets/start.png';

export const GAME_DURATION = 60;

export const STONE_IMAGES = {
  stone1,
  stone2,
  stone3,
  stone4
} as const;

export const BLAST_IMAGES = {
  blast0: blastImage0,
  blast1: blastImage1
} as const;

export const START_IMAGE = startImage;