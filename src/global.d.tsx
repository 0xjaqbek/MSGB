// src/types/global.d.ts
interface TelegramWebAppUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  }
  
  interface TelegramWebApp {
    sendData(arg0: string): unknown;
    initDataUnsafe: {
      user?: TelegramWebAppUser;
    };
    ready(): void;
    close(): void;
    setHeaderColor(color: string): void;
    MainButton: {
      text: string;
      show(): void;
      hide(): void;
      onClick(callback: () => void): void;
    };
  }
  
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
  