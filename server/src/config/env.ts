import dotenv from 'dotenv';
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  SERVICE_TOKEN: required('SERVICE_TOKEN'),
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Pulse CRM <onboarding@resend.dev>',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5174',
  ENABLE_INTERNAL_CRON: process.env.ENABLE_INTERNAL_CRON === 'true',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
};
