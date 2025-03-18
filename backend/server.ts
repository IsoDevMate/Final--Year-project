import * as admin from 'firebase-admin';
import * as serviceAccount from './comfybase-348d1-firebase-adminsdk-fbsvc-3a35a942ec.json';
import router from "./routes/routes"
import express from "express"
const app = express();
import dotenv from "dotenv"
import cors from "cors"
dotenv.config()
import { databaseService } from './config/db';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { setupPassport } from './config/passport';
import passport from 'passport';
import session from 'express-session';
import config from './config/config';
// import cookieParser from 'cookie-parser';


const params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url
}

const Admin = admin.initializeApp({
  credential: admin.credential.cert(params as admin.ServiceAccount),
  storageBucket: 'gs://comfybase-348d1.appspot.com',
});

const storage = Admin.storage().bucket();
const corsOptions = {
  origin: "*"
  
}
// app.use(cookieParser());

app.use(session({
  secret: config.sessionSecret || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions))
setupPassport();
app.use(passport.initialize());


app.use('/', router);

//middlewares
app.use((err: any, req: any, res: any, next: any) => {
    if (err.status === 401) {
      res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }
    next(err);
  });

  app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    });


async function startServer() {
  try {
    // Check db connection
    const connectionStatus = await databaseService.testConnection();
    console.log("here is the connectionstatus message",connectionStatus.message);

    if (!connectionStatus.success) {
      console.log("Waiting for database connection...");
      // Wait for a bit and try again or proceed with caution
    } else {
      try {
        const stats = await databaseService.getDatabaseStats();
        console.log('Database Stats:', stats);
      } catch (error) {
        console.error("Failed to get database stats:", error);
        // Continue anyway as this isn't critical
      }
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })
    .on('error', (error) => {
      console.log(`Error is : ${error}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
