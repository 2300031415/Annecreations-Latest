/**
 * Role Seeder Script
 *
 * This script:
 * 1. Creates the SuperAdmin role with full permissions
 * 2. Creates or updates the SuperAdmin user with the provided password
 * 3. Can be run multiple times safely (idempotent)
 *
 * Note: Only SuperAdmin role is created. All other roles should be created
 *       by SuperAdmin through the API for complete control.
 *
 * Usage:
 *   npm run seed:roles -- --password=yourPassword
 *   OR
 *   npm run seed:roles -- --adminEmail=admin@example.com --password=yourPassword
 *   OR
 *   npm run seed:roles -- --adminEmail=admin@example.com --username=admin --password=yourPassword
 */

import dotenv from 'dotenv';

import { connectMongoDB } from '../config/db';
import Admin from '../models/admin.model';
import Role from '../models/role.model';
import { AVAILABLE_FEATURES } from '../types/models/role';
import { hashAdminPassword } from '../utils/passwordUtils';
import { normalizePermissions } from '../utils/permissions';

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let adminEmail: string | null = null;
let adminUsername: string | null = null;
let adminPassword: string | null = null;

for (const arg of args) {
  if (arg.startsWith('--adminEmail=')) {
    adminEmail = arg.split('=')[1].trim();
  } else if (arg.startsWith('--username=')) {
    adminUsername = arg.split('=')[1].trim();
  } else if (arg.startsWith('--password=')) {
    adminPassword = arg.split('=')[1].trim();
  }
}

async function seedRoles() {
  try {
    console.log('🌱 Starting role seeding process...\n');

    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create SuperAdmin role
    console.log('📋 Step 1: Creating SuperAdmin role...');

    let superAdminRole = await Role.findOne({ name: 'SuperAdmin' });

    if (!superAdminRole) {
      // Create SuperAdmin role with all permissions
      const allPermissions = AVAILABLE_FEATURES.map(feature => {
        return {
          feature,
          create: true,
          read: true,
          update: true,
          delete: true,
        };
      });

      // Normalize permissions
      const normalizedPermissions = normalizePermissions(allPermissions);

      superAdminRole = new Role({
        name: 'SuperAdmin',
        description: 'Full system access with all permissions',
        permissions: normalizedPermissions,
        status: true,
      });
      await superAdminRole.save();
      console.log('✅ SuperAdmin role created\n');
    } else {
      console.log('⏭️  SuperAdmin role already exists\n');
    }

    // Step 2: Create or update SuperAdmin user
    console.log('📋 Step 2: Creating/updating SuperAdmin user...');

    let mainAdmin;

    if (adminEmail) {
      // Find admin by email
      mainAdmin = await Admin.findOne({ email: adminEmail });
      if (!mainAdmin) {
        console.error(`❌ Admin with email ${adminEmail} not found`);
        process.exit(1);
      }
    } else {
      // Find the first admin or admin with username 'admin'
      mainAdmin = await Admin.findOne({ username: adminUsername || 'admin' }).sort({
        createdAt: 1,
      });

      if (!mainAdmin) {
        mainAdmin = await Admin.findOne().sort({ createdAt: 1 });
      }
    }

    // Create new admin if none exists and password is provided
    if (!mainAdmin && adminPassword) {
      console.log('⚠️  No admin found. Creating new SuperAdmin user...');

      const { hashedPassword, salt } = await hashAdminPassword(adminPassword);

      mainAdmin = new Admin({
        username: adminUsername || 'admin',
        email: adminEmail || 'admin@example.com',
        password: hashedPassword,
        salt: salt,
        role: superAdminRole._id,
        status: true,
      });

      await mainAdmin.save();
      console.log(`✅ New SuperAdmin user created: ${mainAdmin.username} (${mainAdmin.email})\n`);
    } else if (!mainAdmin) {
      console.error(
        '❌ No admin users found in database. Please provide --password to create one.'
      );
      process.exit(1);
    } else {
      // Update existing admin
      // Assign SuperAdmin role
      mainAdmin.role = superAdminRole._id;

      // Update password if provided
      if (adminPassword) {
        const { hashedPassword, salt } = await hashAdminPassword(adminPassword);
        mainAdmin.password = hashedPassword;
        mainAdmin.salt = salt;
        console.log('🔐 Password updated for existing admin');
      }

      await mainAdmin.save();
      console.log(`✅ SuperAdmin role assigned to: ${mainAdmin.username} (${mainAdmin.email})\n`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - SuperAdmin role: Created/Verified`);
    console.log(`   - SuperAdmin user: ${mainAdmin.username} (${mainAdmin.email})`);
    if (adminPassword) {
      console.log(`   - Password: ${adminPassword.length > 0 ? 'Updated/Set' : 'Not changed'}`);
    }

    console.log('\n🎉 Role seeding completed successfully!');
    console.log(
      'ℹ️  Note: Only SuperAdmin role is created. SuperAdmin can create other roles via API.\n'
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
}

// Run the seeder
seedRoles();
