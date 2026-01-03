// Centralized Admin configuration
// This is the ONLY admin Telegram ID for the entire app

export const ADMIN_TELEGRAM_ID = 6657246146;

// Array format for backward compatibility
export const ADMIN_TELEGRAM_IDS = [ADMIN_TELEGRAM_ID];

// Helper function to check if a user is admin
export const isAdmin = (telegramId: number | string | undefined | null): boolean => {
  if (!telegramId) return false;
  const id = typeof telegramId === 'string' ? parseInt(telegramId, 10) : telegramId;
  return id === ADMIN_TELEGRAM_ID;
};
