import mongoose from 'mongoose';

class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {
    this.connect();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async connect() {
    try {
      const dbUri = process.env.MONGODB_URI || ""
      await mongoose.connect(dbUri);
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<{ status: string; message: string }> {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        throw new Error('Database connection is not established');
      }
      return {
        status: 'connected',
        message: 'Successfully connected to the database',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database connection error: ${(error as Error).message}`,
      };
    }
  }

  public async getDatabaseStats(): Promise<{
    collectionCount: number;
    databaseSize: string;
  }> {
    try {
      if (!mongoose.connection.db) {
        throw new Error('Database connection is not established');
      }
      const stats = await mongoose.connection.db.stats();
      return {
        collectionCount: stats.collections,
        databaseSize: `${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  public closeConnection(): void {
    try {
      mongoose.connection.close();
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
