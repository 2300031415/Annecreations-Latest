import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectMongoDB } from '../config/db';

dotenv.config();

const run = async () => {
  console.log('🔄 Connecting to MongoDB...');

  try {
    await connectMongoDB();

    if (!mongoose.connection.db) throw new Error('DB not connected');

    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();

    console.log(`📊 Found ${collections.length} collections\n`);

    // Check each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
    }

    console.log('\n🏁 Check completed');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Get the absolute path of the current module
const __filename = path.resolve(fileURLToPath(import.meta.url));

// Check if the script was run directly (not imported)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  run();
}
