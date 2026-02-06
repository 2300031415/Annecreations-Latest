import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';

import { connectMongoDB } from '../config/db';

async function cleanupDatabase() {
  console.log('🧹 Cleaning up MongoDB database...\n');

  try {
    await connectMongoDB();

    if (!mongoose.connection.db) throw new Error('DB not connected');

    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections\n`);

    // Drop all collections (optional - uncomment if needed)
    for (const collection of collections) {
      try {
        await db.dropCollection(collection.name);
        console.log(`✅ Dropped collection: ${collection.name}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${collection.name}: ${(error as Error).message}`);
      }
    }

    // Drop all indexes to clean up duplicates
    for (const collection of collections) {
      try {
        await db.collection(collection.name).dropIndexes();
        console.log(`✅ Dropped indexes for: ${collection.name}`);
      } catch (error) {
        console.log(
          `⚠️  Could not drop indexes for ${collection.name}: ${(error as Error).message}`
        );
      }
    }

    console.log('\n✅ Database cleanup completed!');
    console.log('💡 You can now run the migration check again');
  } catch (error) {
    console.error('❌ Error during cleanup:', (error as Error).message);
  } finally {
    await mongoose.disconnect();
  }
}

// Get the absolute path of the current module
const __filename = path.resolve(fileURLToPath(import.meta.url));

// Check if the script was run directly (not imported)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  cleanupDatabase();
}

export default cleanupDatabase;
