// src/config/config.ts

interface Config {
  API_URL: string;
  ENV: 'development' | 'production' | 'test';
}

// In development, we use just /api/v1 because the proxy will handle the full URL
export const config: Config = {
  API_URL: import.meta.env.VITE_API_URL + '/api/v1',
  ENV: (import.meta.env.VITE_NODE_ENV as Config['ENV']) || 'development',
};
