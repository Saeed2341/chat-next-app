// src/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
    JWT_SECRET: string;
    NEXT_PUBLIC_SOCKET_URL: string;
    NODE_ENV: "development" | "production" | "test";
  }
}