// Ensure this file is treated as a module
export {};

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
          color: string;
          textColor: string;
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

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

// If you need to declare any additional global types or interfaces, add them here