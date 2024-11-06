export type Stone = {
    id: number;
    type: number;
    speed: number;
    startX?: number;
    endX?: number;
    startY?: number;
    endY?: number;
    posX?: number;
    posY?: number;
    direction: 'horizontal' | 'vertical';
  };
  
  export type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
  };
  
  // Add this to enable Telegram types globally
  declare global {
    interface Window {
      Telegram?: {
        WebApp: {
          ready: () => void;
          expand: () => void;
          disableVerticalSwipes: () => void;
          setHeaderColor: (color: string) => void;
          setBottomBarColor: (color: string) => void;
          initDataUnsafe?: {
            user?: TelegramUser;
          };
          MainButton: {
            text: string;
            onClick: (callback: () => void) => void;
            show: () => void;
            hide: () => void;
          };
          sendData: (data: string) => void;
        };
      };
    }
  }
 
  export interface UserVisit {
    lastVisit: string;
    currentStreak: number;
    highestStreak: number;
    totalVisits: number;
    dailyVisits: { [key: string]: number };
    firstVisitComplete: boolean;
    playsToday: number;
    maxPlaysToday: number;
  }
  
  export interface VisitStats {
    lastVisit: string;
    currentStreak: number;
    highestStreak: number;
    totalVisits: number;
    dailyVisits: { [key: string]: number };
    firstVisitComplete: boolean;
    isNewDay: boolean;
    isFirstVisit: boolean;
    todayVisits: number;
    playsRemaining: number;
    playsToday: number;
    maxPlaysToday: number;
  }
  
  export type NavigationPage = 'main' | 'friends' | 'account' | 'tasks';