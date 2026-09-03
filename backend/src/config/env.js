const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env si existe
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5180,
  DB_USER: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'TECNOlogia2026.$',
  DB_SERVER: process.env.DB_SERVER || process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || process.env.POSTGRES_DB || 'conteo',
  DATABASE_URL: process.env.DATABASE_URL || '',
  OCR_PROVIDER: process.env.OCR_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
};
