
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import models (using dynamic import or just defining simple schemas/models if needed, 
// but better to use existing models if possible. However, to avoid import issues with ts-node/tsx 
// and complex dependencies, I'll define minimal models or try to import them if they are simple)

// Actually, let's try to use the existing connection logic and models if possible.
// But to be safe and quick, I'll just connect and query generic collections or define loose schemas.
// The user wants to know "what type of data".

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/anneCreationsProd');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkCollections = async () => {
    await connectDB();

    const startOfDay = new Date('2026-01-21T00:00:00.000Z');
    const endOfDay = new Date('2026-01-21T23:59:59.999Z');

    console.log(`Checking for data between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}...\n`);

    const collections = await mongoose.connection.db.listCollections().toArray();

    let foundData = false;

    for (const collection of collections) {
        const name = collection.name;
        // Skip system collections
        if (name.startsWith('system.')) continue;

        const Model = mongoose.model(name, new mongoose.Schema({}, { strict: false }), name);

        const countCreated = await Model.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const countUpdated = await Model.countDocuments({
            updatedAt: { $gte: startOfDay, $lte: endOfDay }
        });

        if (countCreated > 0 || countUpdated > 0) {
            foundData = true;
            console.log(`Collection: ${name}`);
            if (countCreated > 0) console.log(`  - Created: ${countCreated} documents`);
            if (countUpdated > 0) console.log(`  - Updated: ${countUpdated} documents`);

            // Sample one document to see "what type of data"
            if (countCreated > 0) {
                const doc = await Model.findOne({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).lean();
                console.log(`  - Sample (Created):`, JSON.stringify(doc, null, 2).substring(0, 200) + '...');
            }
            console.log('-----------------------------------');
        }
    }

    if (!foundData) {
        console.log('No data found for 21-01-2026 in any collection.');
    }

    await mongoose.disconnect();
};

checkCollections();
