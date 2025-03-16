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
  origin:"*"
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions))
app.use('/api', router);

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
    console.log(connectionStatus.message);
    const stats = await databaseService.getDatabaseStats();
    console.log('Database Stats:', stats);

    mongoose.connection.once('open', () => {
      console.log(`Connected Successfully to the Database: ${mongoose.connection.name}`);
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      })
      .on('error', (error) => {
        console.log(`Error is : ${error}`);
      })
      .on('disconnected', () => {
        console.log("Database is disconnected");
      })
      .on('reconnected', () => {
        console.log("Database is reconnected");
      })
      .on('close', () => {
        console.log("Database connection is closed");
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}


startServer();
