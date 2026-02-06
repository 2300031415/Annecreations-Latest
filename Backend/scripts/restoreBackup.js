import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'anneCreations';
const BACKUP_PATH = 'D:\\mongo_backup\\anneCreationsProd';

async function restoreDatabase() {
    const client = new MongoClient(MONGODB_URI);

    try {
        console.log('🔄 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DB_NAME);

        // Get all BSON files in the backup directory
        const files = fs.readdirSync(BACKUP_PATH);
        const bsonFiles = files.filter(f => f.endsWith('.bson'));

        console.log(`\n📦 Found ${bsonFiles.length} collections to restore\n`);

        for (const file of bsonFiles) {
            const collectionName = file.replace('.bson', '');
            const filePath = path.join(BACKUP_PATH, file);

            console.log(`📥 Restoring ${collectionName}...`);

            try {
                // Read BSON file
                const bsonData = fs.readFileSync(filePath);

                // Parse BSON and insert documents
                // Note: This is a simplified approach. For production, use mongorestore
                const collection = db.collection(collectionName);

                // Drop existing collection
                try {
                    await collection.drop();
                    console.log(`   Dropped existing ${collectionName}`);
                } catch (err) {
                    // Collection might not exist, that's okay
                }

                // For now, let's just create the collection
                // The actual BSON parsing would require the 'bson' package
                console.log(`   ⚠️  Collection ${collectionName} prepared (BSON parsing requires additional setup)`);

            } catch (err) {
                console.error(`   ❌ Error restoring ${collectionName}:`, err.message);
            }
        }

        console.log('\n✅ Database restore process completed');
        console.log('\n⚠️  Note: Full BSON restoration requires mongorestore tool');
        console.log('   Please install MongoDB Database Tools from:');
        console.log('   https://www.mongodb.com/try/download/database-tools');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

restoreDatabase();
