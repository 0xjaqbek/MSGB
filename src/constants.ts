export const GAME_DURATION = 60; // 60 seconds for the game

export const STONE_IMAGES = {
  stone1: './stone1.png',
  stone2: './stone2.png',
  stone3: './stone3.png',
  stone4: './stone4.png'
} as const;

export const BLAST_IMAGES = {
  blast0: './blast0.png',
  blast1: './blast1.png'
} as const;

export const START_IMAGE = './start.png';

// Type helper for stone images
export type StoneImageKey = keyof typeof STONE_IMAGES;