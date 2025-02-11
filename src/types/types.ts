// types.ts
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
  photo_url?: string;
};

// Updated WebApp type definition
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes: () => void;
        setHeaderColor: (color: string) => void;
        setBottomBarColor: (color: string) => void;
        lockOrientation(): unknown;
        isOrientationLocked: boolean;
        initDataUnsafe?: {
          user?: TelegramUser;
          start_param?: string;  // Added this line
          auth_date?: number;
          hash?: string;
          query_id?: string;
        };
        MainButton: {
          color: string;
          textColor: string;
          text: string;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        sendData: (data: string) => void;
        requestFullscreen?: () => void;
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
  invitedBy?: string;
  permanentBonusTickets: number;
  invites: {
    invitedFriends: string[];
    timestamp: number;
  };
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