// Centralized TON payment configuration
// This is the ONLY wallet address for all TON payments in the app

export const TON_PAYMENT_ADDRESS = 'UQCiVNm22dMF9S3YsHPcgrmqXEQHt4MIdk_N7VJu88NrLr4R';

// Transaction validity period in seconds (10 minutes)
export const PAYMENT_VALID_SECONDS = 600;

// Helper to get valid until timestamp
export const getValidUntil = () => Math.floor(Date.now() / 1000) + PAYMENT_VALID_SECONDS;

// Convert TON to nanotons
export const tonToNano = (ton: number): string => Math.floor(ton * 1e9).toString();
