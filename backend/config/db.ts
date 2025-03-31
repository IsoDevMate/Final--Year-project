import mongoose from 'mongoose';
import config from './config';

class DatabaseService {
  private connection: mongoose.Connection | null = null;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      if (!config.mongoUri) {
        throw new Error('MongoDB URI is not defined in environment variables');
      }

      await mongoose.connect(config.mongoUri);
      this.connection = mongoose.connection;

      console.log('Connected to MongoDB');

      // Handle connection events
      this.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      this.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      // Don't exit the process here, let the application handle the error
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }

  async testConnection() {
    try {
      if (!this.connection || this.connection.readyState !== 1) {
        return { success: false, message: 'Database connection is not established' };
      }
      return { success: true, message: 'Database connection is established' };
    } catch (error) {
      return { success: false, message: `Database connection error: ${error}` };
    }
  }

  async getDatabaseStats() {
    try {
      const result = await this.testConnection();
      if (!result.success) {
        throw new Error(result.message);
      }

      // Basic stats check
      return {
        databaseName: this.connection?.name,
        connectionState: this.connection?.readyState,
        collections: Object.keys(this.connection?.collections || {}).length
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
