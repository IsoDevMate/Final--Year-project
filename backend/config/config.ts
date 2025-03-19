// import dotenv from 'dotenv';

// dotenv.config();

// const config = {
//   // Server configuration
//   port: process.env.PORT,
//   nodeEnv: process.env.NODE_ENV,

//   // MongoDB configuration
//   mongoURI: process.env.MONGO_URI,

//   // JWT configuration
//   jwtSecret: process.env.JWT_SECRET,
//   jwtExpiresIn: process.env.JWT_EXPIRES_IN,

//   // Stripe configuration
//   stripeSecretKey: process.env.STRIPE_SECRET_KEY,
//   stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

//   // Firebase configuration
//   firebase: {
//     apiKey: process.env.FIREBASE_API_KEY,
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.FIREBASE_APP_ID
//   }
// };

// export default config;

import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  sessionSecret: process.env.SESSION_SECRET,

  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    accessTokenExpiration: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15', 10) * 60,
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

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  },
frontendUrl: process.env.FRONTEND_URL,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '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',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "oumabarack1047@gmail.com",
  },
};

export default config;
