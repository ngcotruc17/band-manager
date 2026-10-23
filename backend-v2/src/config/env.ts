import dotenv from 'dotenv';
dotenv.config();

export interface EnvConfig {
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  WEBHOOK_SECRET: string;
  CORS_ALLOWED_ORIGINS: string[];
  IS_PRODUCTION: boolean;
}

const parseOrigins = (rawOrigins?: string): string[] => {
  const defaults = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://sacband.vercel.app'
  ];

  if (!rawOrigins) return defaults;
  const parsed = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : defaults;
};

export const env: EnvConfig = {
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/band-booking',
  JWT_SECRET: process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
  CORS_ALLOWED_ORIGINS: parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};

export const validateEnv = (): void => {
  if (env.IS_PRODUCTION && env.JWT_SECRET === 'mat_khau_bi_mat_cua_ban_123456') {
    console.warn('⚠️ WARNING: Using default JWT_SECRET in production mode! Set process.env.JWT_SECRET.');
  }

  if (!env.WEBHOOK_SECRET) {
    console.warn('ℹ️ INFO: WEBHOOK_SECRET is empty. Bank webhook requests will strictly require authentication key.');
  }
};
