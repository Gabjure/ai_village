/**
 * Centralized sprite base path — respects Vite's `base` config.
 *
 * In dev (base: '/'), returns '/assets/sprites/pixellab'.
 * In prod (base: '/mvee/'), returns '/mvee/assets/sprites/pixellab'.
 *
 * Without this, sprite requests bypass the reverse proxy route and 404
 * (or worse, return HTML from a catch-all handler).
 */

/** Vite injects BASE_URL from the `base` config at build time. */
const BASE_URL: string =
  typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : '/';

/**
 * Base path for all PixelLab sprite assets.
 * Use this instead of hardcoding '/assets/sprites/pixellab'.
 */
export const SPRITE_BASE_PATH = `${BASE_URL}assets/sprites/pixellab`;

export const MAP_OBJECTS_BASE_PATH = `${BASE_URL}assets/sprites/map_objects`;
