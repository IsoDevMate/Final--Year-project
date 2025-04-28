import router from "./routes/routes"
import express from "express"
const app = express();
import dotenv from "dotenv"
import cors from "cors"
dotenv.config()
import { databaseService } from './config/db';
import { Request, Response, NextFunction } from 'express';
import { setupPassport } from './config/passport';
import passport from 'passport';
import config from './config/config';
import cron from 'node-cron';
import compression from 'compression';
import { EventCleanupService } from './services/eventcleanup.service';
import { paymentChecker } from './utils/paymentchecker.utils';



const corsOptions = {
  origin: "*"
}

//memory optimizations
app.use(compression());
app.use((req, res, next) => {
  const startMem = process.memoryUsage().heapUsed;

  res.on('finish', () => {
    const endMem = process.memoryUsage().heapUsed;
    const memoryDiff = endMem - startMem;
    if (memoryDiff > 5 * 1024 * 1024) { // Log if route consumed more than 5MB
      console.log(`Memory intensive route: ${req.method} ${req.path} - Used ${(memoryDiff / 1024 / 1024).toFixed(2)} MB`);
    }
  });

  next();
});

paymentChecker.start();


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  paymentChecker.stop();
  // Other cleanup code...

  process.exit(0);
});

// cleanup every 10 minutes
const scheduleCleanup = () => {
  cron.schedule('0 */6 * * *', () => {
    EventCleanupService.cleanupPastEvents()
      .catch(err => console.error('Error during event cleanup:', err));
  });
};

scheduleCleanup();

function manageMemory() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const rss = memUsage.rss / 1024 / 1024;

  console.log(`Memory Status: HeapUsed: ${heapUsedMB.toFixed(2)}MB, HeapTotal: ${heapTotalMB.toFixed(2)}MB, RSS: ${rss.toFixed(2)}MB`);

  // If memory usage gets high, try to clean up
  if (heapUsedMB > 500) {
    console.log('Memory usage high, attempting cleanup...');
    try {
      if (typeof global.gc === 'function') {
        global.gc();
      } else {
        console.log('Manual garbage collection not available. Run with --expose-gc flag');
      }
      console.log('Garbage collection triggered');
    } catch (e) {
      console.log('Manual garbage collection not available. Run with --expose-gc flag');
    }
  }
}


cron.schedule('*/1 * * * *', () => {
  manageMemory();
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Graceful shutdown initiated...');

  await databaseService.disconnect();
  console.log('Graceful shutdown complete');
  process.exit(0);
}

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
    const connectionStatus = await databaseService.testConnection();
    console.log("here is the connectionstatus message", connectionStatus.message);

    if (!connectionStatus.success) {
      console.log("Waiting for database connection...");
    } else {
      try {
        const stats = await databaseService.getDatabaseStats();
        console.log('Database Stats:', stats);
      } catch (error) {
        console.error("Failed to get database stats:", error);
      }
    }

    const PORT = parseInt(String(config.port || "3000"), 10);
    app.listen(PORT,'0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    })

    .on('error', (error) => {
      console.log(`Error is : ${error}`);
    });

    // Schedule a cron job to keep the server alive
    cron.schedule('*/1 * * * *', () => {
      console.log('...');
    });

     manageMemory();

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
