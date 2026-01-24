/// <reference types="vite/client" />

/**
 * TypeScript in this project currently does not have `compilerOptions.paths` configured
 * (tsconfig files are read-only in this workspace), while the codebase uses Vite aliases
 * like `components/*`, `utils/*`, `pages/*`, etc.
 *
 * These ambient module declarations prevent TS2307 "Cannot find module" errors during build.
 */
declare module "components/*";
declare module "pages";
declare module "pages/*";
declare module "context";
declare module "hooks/*";
declare module "utils/*";
declare module "locales";
declare module "locales/*";
declare module "assets/*";
declare module "wallet/*";

// Common asset/module shims
declare module "*.css";
declare module "*.scss";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";
declare module "*.mp3";
declare module "*.json";
