/**
 * Utility functions for managing API keys in localStorage
 */

const GEMINI_API_KEY_STORAGE = "gemini_api_key";

/**
 * Get the stored Gemini API key
 */
export function getGeminiApiKey(): string | null {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE);
}

/**
 * Save the Gemini API key to localStorage
 */
export function saveGeminiApiKey(apiKey: string): void {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
}

/**
 * Remove the Gemini API key from localStorage
 */
export function removeGeminiApiKey(): void {
  localStorage.removeItem(GEMINI_API_KEY_STORAGE);
}

/**
 * Check if Gemini API key exists
 */
export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey() !== null;
}
