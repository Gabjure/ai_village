/**
 * Centralized URL configuration for the renderer package.
 * Uses Vite env vars in production, falls back to localhost for local dev.
 */
export const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3001';
export const LLM_PROXY_URL = (import.meta.env?.VITE_LLM_PROXY_URL as string) || 'http://localhost:8766';
export const METRICS_WS_URL = (import.meta.env?.VITE_METRICS_WS_URL as string) || 'ws://localhost:8765';
