import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  sessionSecret: process.env.SESSION_SECRET,

  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    accessTokenExpiration: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION || '30', 10) * 24 * 60 * 60,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    refreshTokenExpiration: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7', 10) * 24 * 60 * 60,
    qrCodeSecret: process.env.JWT_QR_CODE_SECRET,
  },

  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackUrl: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback',
    scope: 'openid profile email'
  },
  storagebucketnameis: process.env.STORAGE_BUCKET_NAME || 'gs://uploadtimes-2d6d3.appspot.com',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
frontendUrl: process.env.FRONTEND_URL,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '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',
    fromEmail: process.env.SENDGRID_SENDER_EMAIL || "oumabarack1047@gmail.com",
  },
};

export default config;
