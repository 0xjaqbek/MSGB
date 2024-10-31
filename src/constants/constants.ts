import stone1 from './assets/stone1.png';
import stone2 from './assets/stone2.png';
import stone3 from './assets/stone3.png';
import stone4 from './assets/stone4.png';
import blastImage0 from './assets/blast0.png';
import blastImage1 from './assets/blast1.png';
import startImage from './assets/start.png';

export const GAME_DURATION = 60; // 60 seconds for the game

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

// Type helper for stone images
export type StoneImageKey = keyof typeof STONE_IMAGES;