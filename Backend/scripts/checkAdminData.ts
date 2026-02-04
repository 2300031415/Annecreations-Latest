
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/anneCreationsProd');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkAdminData = async () => {
    await connectDB();

    console.log('\n--- Checking Admin Data ---\n');

    // Check Admins Collection
    // Assuming the collection name is 'admins' based on standard naming, or we can list collections to be sure.
    const collections = await mongoose.connection.db.listCollections().toArray();
    const adminCollection = collections.find(c => c.name === 'admins' || c.name === 'users');

    if (adminCollection) {
        const AdminModel = mongoose.model(adminCollection.name, new mongoose.Schema({}, { strict: false }), adminCollection.name);

        const admins = await AdminModel.find({}).lean();
        console.log(`Found ${admins.length} documents in '${adminCollection.name}' collection.`);

        admins.forEach((admin: any) => {
            console.log(`\nUser ID: ${admin._id}`);
            console.log(`Name: ${admin.name || admin.firstName + ' ' + admin.lastName}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Role: ${admin.role || 'N/A'}`);
            console.log(`Created At: ${admin.createdAt}`);
            console.log(`Updated At: ${admin.updatedAt}`);
        });
    } else {
        console.log('No "admins" or "users" collection found.');
    }

    console.log('\n--- Checking Roles ---\n');
    const roleCollection = collections.find(c => c.name === 'roles');
    if (roleCollection) {
        const RoleModel = mongoose.model('roles', new mongoose.Schema({}, { strict: false }), 'roles');
        const roles = await RoleModel.find({}).lean();
        console.log(`Found ${roles.length} roles:`);
        roles.forEach((role: any) => {
            console.log(`- ${role.name}`);
        });
    }

    await mongoose.disconnect();
};

checkAdminData();
