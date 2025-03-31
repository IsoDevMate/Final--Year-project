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
import cron from 'node-cron';

const corsOptions = {
  origin: "*"
}


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
    console.log("here is the connectionstatus message", connectionStatus.message);

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

    const PORT = parseInt(process.env.PORT || "7000", 10);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    })
    .on('error', (error) => {
      console.log(`Error is : ${error}`);
    });

    // Schedule a cron job to keep the server alive
    cron.schedule('*/1 * * * *', () => {
      console.log('Cron job running every 1 minutes to keep the server alive');
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
