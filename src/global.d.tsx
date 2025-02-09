// Ensure this file is treated as a module
export {};



interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

// If you need to declare any additional global types or interfaces, add them here