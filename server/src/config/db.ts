import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongodInstance: any = null;

export async function connectDB(): Promise<void> {
  const customUri = process.env.MONGODB_URI;

  try {
    if (customUri && customUri.trim().length > 0) {
      console.log('Connecting to configured MongoDB instance...');
      await mongoose.connect(customUri);
      console.log('✅ Connected to MongoDB via MONGODB_URI.');
      return;
    }

    // Zero-config fallback: dynamically initialize MongoDB In-Memory Server
    console.log('No MONGODB_URI provided. Starting in-memory MongoDB Server for local development...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const inMemoryUri = mongodInstance.getUri();
    
    await mongoose.connect(inMemoryUri);
    console.log(`✅ Connected to MongoDB (In-Memory Server: ${inMemoryUri})`);
  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}
