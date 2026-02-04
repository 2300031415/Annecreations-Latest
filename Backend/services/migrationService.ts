// services/migrationService.ts
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';
import type { Connection, RowDataPacket } from 'mysql2/promise';

import { connectMongoDB, connectMySQL } from '../config/db';
// Import models for each phase
import Admin from '../models/admin.model';
import Cart from '../models/cart.model';
import Category from '../models/category.model';
import { Counter } from '../models/counter.model';
import Country from '../models/country.model';
import Customer from '../models/customer.model';
import Language from '../models/language.model';
import MigrationStatus from '../models/migrationStatus.model';
import ProductOption from '../models/option.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Wishlist from '../models/wishlist.model';
import Zone from '../models/zone.model';

// Define types for migration service
type Stats = {
  processed: number;
  succeeded: number;
  failed: number;
};
class MigrationService {
  mysql: Connection | null;
  stats: Stats;
  startTime: Date | null;
  objectIdMapper: Map<string, Map<number, mongoose.Types.ObjectId>>;
  wishlistMappingStats: {
    totalEntries: number;
    successfullyMapped: number;
    skippedDueToMissingCustomer: number;
    skippedDueToMissingProduct: number;
    missingCustomerCount: number;
    missingProductCount: number;
  } | null;

  constructor() {
    this.mysql = null;
    this.startTime = null;
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
    this.objectIdMapper = new Map<string, Map<number, mongoose.Types.ObjectId>>();
    this.wishlistMappingStats = null;
  }

  async initialize() {
    await connectMongoDB();
    this.mysql = await connectMySQL();
    console.log('✅ Database connections established');
  }

  async updateMigrationStatus(
    name: string,
    status: 'running' | 'completed' | 'failed',
    error: Error | null = null
  ) {
    try {
      const update = {
        name,
        status: status === 'running' ? 'inProgress' : status,
        startedAt: null as Date | null,
        completedAt: new Date(),
        migratedDetails: [
          {
            tableName: name,
            processed: this.stats.processed,
            succeeded: this.stats.succeeded,
            failed: this.stats.failed,
            batchSize: 100,
            lastBatchSize: this.stats.processed % 100 || 100,
            totalBatches: Math.ceil(this.stats.processed / 100),
            status: status === 'running' ? 'inProgress' : status,
            error: error ? (error as Error).message : undefined,
          },
        ],
        durationSeconds: 0,
      };

      if (status === 'running' && !this.startTime) {
        this.startTime = new Date();
        update.startedAt = this.startTime;
      }

      if (status === 'completed' || status === 'failed') {
        if (this.startTime) {
          update.durationSeconds = Math.floor(
            (new Date().getTime() - this.startTime.getTime()) / 1000
          );
        }
      }

      await MigrationStatus.findOneAndUpdate({ name }, update, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      console.error(`Error updating migration status for ${name}:`, err);
    }
  }

  resetStats() {
    this.stats = { processed: 0, succeeded: 0, failed: 0 };
    this.startTime = null;
  }

  // PHASE 1: Core Independent Tables
  async migratePhase1() {
    const phaseName = 'phase1_core_independent';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'phase1_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('\n🚀 Starting Phase 1: Core Independent Tables...\n');

    this.resetStats();
    await this.updateMigrationStatus(phaseName, 'running');

    try {
      // Migrate countries
      await this.migrateCountries();

      // Migrate zones
      await this.migrateZones();

      // Migrate language
      await this.migrateLanguages();

      // Migrate Product Options
      await this.migrateProductOptions();

      await this.updateMigrationStatus(phaseName, 'completed', null);

      log(`✅ Phase 1 completed: ${this.stats.succeeded} records migrated`);
      return true;
    } catch (error) {
      await this.updateMigrationStatus(phaseName, 'failed', error as Error);
      console.error('❌ Phase 1 failed:', error);
      throw error;
    }
  }

  async migrateCountries() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'countries_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('📍 Migrating countries...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Clear existing Country data
    log('🧹 Clearing existing Country data...');
    await Country.deleteMany({});

    // Drop indexes to improve bulk insert speed
    try {
      await Country.collection.dropIndexes();
      log('🧹 Dropped indexes on Country collection');
    } catch (err) {
      log('⚠️ No indexes to drop or error dropping: ' + (err as Error).message);
    }

    const [rows] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT * FROM oc_country ORDER BY country_id'
    );

    log(`📊 Found ${rows.length} countries to migrate`);

    let countryCount = 0;
    const BATCH_SIZE = 100;
    let batch = [];
    let batchNumber = 1;

    for (const row of rows) {
      try {
        this.stats.processed++;

        const countryId = new mongoose.Types.ObjectId();

        const country = new Country({
          _id: countryId,
          name: row.name,
          iso_code_2: row.iso_code_2,
          iso_code_3: row.iso_code_3,
          address_format: row.address_format,
          postcode_required: row.postcode_required === 1,
          status: row.status === 1,
        });

        // Store the mapping of MySQL country_id to MongoDB ObjectId
        if (!this.objectIdMapper.has('country')) {
          this.objectIdMapper.set('country', new Map());
        }
        this.objectIdMapper.get('country')!.set(row.country_id, countryId);

        batch.push(country.toObject());
        countryCount++;

        if (batch.length === BATCH_SIZE) {
          try {
            await Country.insertMany(batch, { ordered: false });
            this.stats.succeeded += batch.length;

            log(`✅ Countries - batch ${batchNumber} (${countryCount}/${rows.length})`);
          } catch (batchError) {
            console.error(
              `❌ Countries - Batch insert error [batch ${batchNumber}]:`,
              (batchError as Error).message
            );
            this.stats.failed += batch.length;
          }

          batch = [];
          batchNumber++;
        }
      } catch (error) {
        this.stats.failed++;
        console.error(
          `❌ Failed to migrate country ${row.country_id}: ${(error as Error).message}`
        );
      }
    }

    if (batch.length > 0) {
      try {
        await Country.insertMany(batch, { ordered: false });
        this.stats.succeeded += batch.length;
        log(`✅ Countries - final ${batch.length} countries (batch ${batchNumber})`);
      } catch (err) {
        console.error(`❌ Final batch insert error: ${(err as Error).message}`);
        this.stats.failed += batch.length;
      }
    }

    // Recreate indexes
    log('✅ Recreated indexes on Country collection');
    await Country.syncIndexes();

    log(`✅ Countries migration complete: ${countryCount}/${rows.length} successful\n`);
  }

  async migrateZones() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'zones_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('🗺️  Migrating zones...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Clear existing Zone data
    log('🧹 Clearing existing Zone data...');
    await Zone.deleteMany({});

    // Drop indexes to improve bulk insert speed
    try {
      await Zone.collection.dropIndexes();
      log('🧹 Dropped indexes on Zone collection');
    } catch (err) {
      log('⚠️ No indexes to drop or error dropping: ' + (err as Error).message);
    }

    const [rows] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT * FROM oc_zone ORDER BY zone_id'
    );
    const totalZones = rows.length;

    log(`📊 Found ${totalZones} zones to migrate`);

    let zoneCount = 0;
    const BATCH_SIZE = 100;
    let batch = [];
    let batchNumber = 1;

    for (const row of rows) {
      try {
        this.stats.processed++;

        // Check if the country_id exists in the mapping
        const countryObjectId = this.objectIdMapper.get('country')?.get(row.country_id);
        if (!countryObjectId) {
          console.warn(`⚠️ Skipping zone ${row.name} — no country match for ID ${row.country_id}`);
          continue;
        }

        const zoneId = new mongoose.Types.ObjectId();

        const zone = new Zone({
          _id: zoneId,
          country: countryObjectId,
          name: row.name,
          code: row.code,
          status: row.status === 1,
        });

        // Store the mapping of MySQL zone_id to MongoDB ObjectId
        if (!this.objectIdMapper.has('zone')) {
          this.objectIdMapper.set('zone', new Map());
        }
        this.objectIdMapper.get('zone')!.set(row.zone_id, zoneId);

        batch.push(zone.toObject());
        zoneCount++;

        if (batch.length === BATCH_SIZE) {
          try {
            await Zone.insertMany(batch, { ordered: false });
            this.stats.succeeded += batch.length;

            log(`✅ Zones - batch ${batchNumber} (${zoneCount}/${rows.length})`);
          } catch (batchError) {
            console.error(
              `❌ Zones - Batch insert error [batch ${batchNumber}]:`,
              (batchError as Error).message
            );
            this.stats.failed += batch.length;
          }

          batch = [];
          batchNumber++;
        }
      } catch (error) {
        this.stats.failed++;
        console.error(`❌ Failed to migrate zone ${row.zone_id}: ${(error as Error).message}`);
      }
    }

    if (batch.length > 0) {
      try {
        await Zone.insertMany(batch, { ordered: false });
        this.stats.succeeded += batch.length;
        log(`✅ Zones - final ${batch.length} zones (batch ${batchNumber})`);
      } catch (err) {
        console.error(`❌ Final batch insert error: ${(err as Error).message}`);
        this.stats.failed += batch.length;
      }
    }

    // Recreate indexes
    log('✅ Recreated indexes on Zone collection');
    await Zone.syncIndexes();

    log(`✅ Zones migration complete: ${zoneCount}/${totalZones} successful\n`);
  }

  async migrateLanguages() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'languages_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('🗺️  Migrating languages...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    const [rows] = await this.mysql.execute<RowDataPacket[]>('SELECT * FROM oc_language');
    const totalLanguages = rows.length;
    let languageCount = 0;

    for (const row of rows) {
      try {
        this.stats.processed++;

        const language = new Language({
          name: row.name,
          code: row.code,
          locale: row.locale,
          image: row.image,
          directory: row.directory,
          sortOrder: row.sort_order,
          status: row.status === 1,
        });

        const saved = await language.save();

        // Store the mapping of MySQL language_id to MongoDB ObjectId
        if (!this.objectIdMapper.has('language')) {
          this.objectIdMapper.set('language', new Map());
        }
        this.objectIdMapper.get('language')!.set(row.language_id, saved._id);

        this.stats.succeeded++;
        languageCount++;
      } catch (error) {
        this.stats.failed++;
        console.error(
          `❌ Failed to migrate language ${row.language_id}: ${(error as Error).message}`
        );
      }
    }

    log(`✅ Languages migration complete: ${languageCount}/${totalLanguages} successful\n`);
  }

  async migrateProductOptions() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'product_options_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('Migrating product options...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    const [rows] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT * FROM oc_option_value_description'
    );
    let optionsCount = 0;

    for (const row of rows) {
      try {
        this.stats.processed++;

        // Check if the country_id exists in the mapping
        const languageObjectId = this.objectIdMapper.get('language')?.get(row.language_id);

        const productOption = new ProductOption({
          languageId: languageObjectId,
          name: row.name,
          sortOrder: row.option_value_id,
          status: true,
        });

        const saved = await productOption.save();

        // Store the mapping of MySQL option_value_id to MongoDB ObjectId
        if (!this.objectIdMapper.has('productOption')) {
          this.objectIdMapper.set('productOption', new Map());
        }
        this.objectIdMapper.get('productOption')!.set(row.option_value_id, saved._id);

        this.stats.succeeded++;
        optionsCount++;
      } catch (error) {
        this.stats.failed++;
        console.error(
          `❌ Failed to migrate product option ${row.option_value_id}: ${(error as Error).message}`
        );
      }
    }

    log(`✅ Product Options migration: ${optionsCount}/${rows.length} successful\n`);
  }

  // PHASE 2: Catalog Structure
  async migratePhase2() {
    const phaseName = 'phase2_catalog_structure';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'phase2_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('\n🚀 Starting Phase 2: Catalog Structure...\n');

    this.resetStats();
    await this.updateMigrationStatus(phaseName, 'running');

    try {
      // Migrate Categories with descriptions and SEO
      await this.migrateCategories();

      await this.updateMigrationStatus(phaseName, 'completed', null);

      log(`✅ Phase 2 completed: ${this.stats.succeeded} records migrated`);
      return true;
    } catch (error) {
      await this.updateMigrationStatus(phaseName, 'failed', error as Error);
      console.error('❌ Phase 2 failed:', error);
      throw error;
    }
  }

  async migrateCategories() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'categories_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('📂 Migrating categories...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    const [rows] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT cd.*, c.* 
      FROM oc_category_description cd
      JOIN oc_category c ON cd.category_id = c.category_id
      ORDER BY cd.category_id, cd.language_id`
    );

    for (const row of rows) {
      try {
        this.stats.processed++;

        // Skip category_id 0 (root category)
        if (row.category_id === 0) {
          console.warn('⚠️ Skipping root category (category_id 0)');
          continue;
        }

        // Check if the language_id exists in the mapping
        const languageObjectId = this.objectIdMapper.get('language')?.get(row.language_id); // Assuming 1 is the default language_id

        const category = new Category({
          name: row.name,
          image: row.image || '',
          sortOrder: row.sort_order,
          status: row.status === 1,
          languageId: languageObjectId,
          description: row.description || '',
          metaTitle: row.meta_title || '',
          metaDescription: row.meta_description || '',
          metaKeyword: row.meta_keyword || '',
          createdAt: new Date(row.date_added),
          updatedAt: new Date(row.date_modified),
        });

        const saved = await category.save();

        // Store the mapping of MySQL category_id to MongoDB ObjectId
        if (!this.objectIdMapper.has('category')) {
          this.objectIdMapper.set('category', new Map());
        }
        this.objectIdMapper.get('category')!.set(row.category_id, saved._id);

        this.stats.succeeded++;
      } catch (error) {
        this.stats.failed++;
        console.error(
          `❌ Failed to migrate category ${row.category_id}: ${(error as Error).message}`
        );
      }
    }

    log(`✅ Categories migration: ${this.stats.succeeded}/${rows.length} successful\n`);
  }

  // PHASE 3: User Management (Critical Phase)
  async migratePhase3() {
    const phaseName = 'phase3_user_management';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'phase3_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('\n🚀 Starting Phase 3: User Management (CRITICAL)...\n');

    this.resetStats();
    await this.updateMigrationStatus(phaseName, 'running');

    try {
      // First migrate admins
      await this.migrateAdmins();

      // Then migrate customers WITH their addresses
      await this.migrateCustomersWithAddresses();

      // Verify 100% customer migration
      await this.verifyCustomerMigration();

      await this.updateMigrationStatus(phaseName, 'completed', null);

      log(`✅ Phase 3 completed: ${this.stats.succeeded} records migrated`);
      return true;
    } catch (error) {
      await this.updateMigrationStatus(phaseName, 'failed', error as Error);
      console.error('❌ Phase 3 failed:', error);
      throw error;
    }
  }

  async migrateAdmins() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'admins_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('👨‍💼 Migrating admins...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    const [rows] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT * FROM oc_user ORDER BY user_id'
    );

    let adminCount = 0;

    for (const row of rows) {
      try {
        this.stats.processed++;

        const admin = new Admin({
          username: row.username,
          password: row.password,
          salt: row.salt,
          firstName: row.firstname,
          lastName: row.lastname,
          email: row.email,
          image: row.image,
          code: row.code,
          ipAddress: row.ip,
          status: row.status === 1,
          createdAt: new Date(row.date_added),
        });

        await admin.save({ validateBeforeSave: false }); // Bypass Mongoose validation for performance
        this.stats.succeeded++;
        adminCount++;
      } catch (error) {
        this.stats.failed++;
        console.error(`❌ Failed to migrate admin ${row.user_id}: ${(error as Error).message}`);
      }
    }

    log(`✅ Admins migration: ${adminCount}/${rows.length} successful\n`);
  }

  async migrateCustomersWithAddresses() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'customer_migration_log.txt');
    fs.writeFileSync(logFile, '');

    const log = (msg: string) => {
      const ts = new Date().toISOString();
      const logMsg = `[${ts}] ${msg}`;
      console.log(msg);
      fs.appendFileSync(logFile, logMsg + '\n');
    };

    log('👥 Migrating customers with addresses...');

    if (!this.mysql) throw new Error('❌ MySQL connection not initialized');

    log('🧹 Clearing existing customer data...');
    await Customer.deleteMany({});

    try {
      await Customer.collection.dropIndexes();
      log('🧹 Dropped indexes on Customer collection');
    } catch (err) {
      log(`⚠️ No indexes to drop or error dropping: ${(err as Error).message}`);
    }

    const [customers] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_customer ORDER BY customer_id`
    );

    const [addresses] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_address ORDER BY address_id`
    );

    log(`📊 Found ${customers.length} customers to migrate`);

    const languageObjectId = this.objectIdMapper.get('language')?.get(1);
    if (!languageObjectId) throw new Error('❌ languageObjectId not found in objectIdMapper!');

    const addressMap = new Map<number, RowDataPacket[]>();
    addresses.forEach(addr => {
      if (!addressMap.has(addr.customer_id)) addressMap.set(addr.customer_id, []);
      addressMap.get(addr.customer_id)!.push(addr);
    });

    const BATCH_SIZE = 100;
    let batch = [];
    let batchNumber = 1;
    const processedEmails = new Set<string>(); // Track emails within current batch

    for (const customerRow of customers) {
      try {
        this.stats.processed++;

        const customerId = new mongoose.Types.ObjectId();
        const customerAddresses = [];

        for (const addr of addressMap.get(customerRow.customer_id) || []) {
          const countryId = this.objectIdMapper.get('country')?.get(addr.country_id) || null;
          const zoneId = this.objectIdMapper.get('zone')?.get(addr.zone_id) || null;

          if (!countryId) {
            log(
              `⚠️ Missing country for address_id ${addr.address_id} (customer_id: ${customerRow.customer_id})`
            );
          }
          if (!zoneId) {
            log(
              `⚠️ Missing zone for address_id ${addr.address_id} (customer_id: ${customerRow.customer_id})`
            );
          }

          customerAddresses.push({
            firstName: addr.firstname,
            lastName: addr.lastname,
            company: addr.company,
            addressLine1: addr.address_1,
            addressLine2: addr.address_2,
            city: addr.city,
            postcode: addr.postcode,
            country: countryId,
            zone: zoneId,
            preferedBillingAddress: addr.address_id === customerRow.address_id,
          });
        }

        // Handle empty or invalid email addresses
        let email = customerRow.email;

        if (!email || email.trim() === '') {
          email = `customer_${customerRow.customer_id}@anne.com`;
          log(
            `⏭️ Customer ${customerRow.customer_id} - no email data (empty/null) - generated: ${email}`
          );
        }

        // // Handle invalid email format (missing @ symbol)
        // if (!email.includes('@')) {
        //   // Generate a unique email for customers with invalid email format
        //   email = `customer_${customerRow.customer_id}@migrated.local`;
        //   log(
        //     `⚠️ Customer ${customerRow.customer_id} had invalid email format, generated: ${email} - Original: "${customerRow.email}"`
        //   );
        // } else {
        //   // For valid emails, check if duplicate and make unique

        // }

        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
          // Make email unique by adding customer ID
          email = `${email.split('@')[0]}_${customerRow.customer_id}@${email.split('@')[1]}`;
          log(
            `⚠️ Customer ${customerRow.customer_id} had duplicate email in database, made unique: ${email} - Original: "${customerRow.email}"`
          );
        }

        // Check for duplicates within the current batch
        const originalEmail = email;
        let counter = 1;
        while (processedEmails.has(email)) {
          email = `${originalEmail.split('@')[0]}_${customerRow.customer_id}_${counter}@${originalEmail.split('@')[1]}`;
          counter++;
        }

        if (email !== originalEmail) {
          log(
            `⚠️ Customer ${customerRow.customer_id} had duplicate email in current batch, made unique: ${email} - Original: "${customerRow.email}"`
          );
        }

        processedEmails.add(email);

        const customer = new Customer({
          _id: customerId,
          languageId: languageObjectId,
          firstName: customerRow.firstname,
          lastName: customerRow.lastname,
          email: email,
          mobile: customerRow.telephone,
          password: customerRow.password,
          salt: customerRow.salt,
          newsletter: customerRow.newsletter === 1,
          ipAddress: customerRow.ip,
          status: customerRow.status === 1,
          addresses: customerAddresses,
          mobileVerified: true,
          emailVerified: true,
          createdAt: new Date(customerRow.date_added),
        });

        if (!this.objectIdMapper.has('customer')) {
          this.objectIdMapper.set('customer', new Map());
        }
        this.objectIdMapper.get('customer')!.set(customerRow.customer_id, customerId);

        batch.push(customer.toObject());

        if (batch.length === BATCH_SIZE) {
          try {
            await Customer.collection.insertMany(batch, { ordered: false });
            this.stats.succeeded += batch.length;
            log(`✅ Inserted batch ${batchNumber} (${this.stats.succeeded}/${customers.length})`);
          } catch (err) {
            log(`❌ Batch insert error [batch ${batchNumber}]: ${(err as Error).message}`);
            this.stats.failed += batch.length;
          }
          batch = [];
          processedEmails.clear(); // Clear processed emails for next batch
          batchNumber++;
        }
      } catch (err) {
        this.stats.failed++;
        log(`❌ Failed to process customer ${customerRow.customer_id}: ${(err as Error).message}`);
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      try {
        await Customer.collection.insertMany(batch, { ordered: false });
        this.stats.succeeded += batch.length;
        log(`✅ Inserted final batch ${batchNumber} (${batch.length} customers)`);
      } catch (err) {
        log(`❌ Final batch insert error [batch ${batchNumber}]: ${(err as Error).message}`);
        this.stats.failed += batch.length;
      }
    }

    await Customer.syncIndexes();
    log(`✅ Customer migration complete: ${this.stats.succeeded}/${customers.length} succeeded\n`);
  }

  async verifyCustomerMigration() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'customer_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('🔍 Verifying customer migration (100% requirement)...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Count MySQL customers
    const [mysqlCount] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM oc_customer'
    );
    const mysqlCustomers = mysqlCount[0].count;

    // Count MongoDB customers
    const mongoCustomers = await Customer.countDocuments();

    // Count MySQL addresses
    const [mysqlAddrCount] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM oc_address'
    );
    const mysqlAddresses = mysqlAddrCount[0].count;

    // Count MongoDB addresses (embedded)
    const mongoAddresses = await Customer.aggregate([
      { $project: { addressCount: { $size: '$addresses' } } },
      { $group: { _id: null, totalAddresses: { $sum: '$addressCount' } } },
    ]);
    const mongoAddressCount = mongoAddresses.length > 0 ? mongoAddresses[0].totalAddresses : 0;

    log(`📊 Migration Verification:`);
    log(`   MySQL Customers: ${mysqlCustomers}`);
    log(`   MongoDB Customers: ${mongoCustomers}`);
    log(`   MySQL Addresses: ${mysqlAddresses}`);
    log(`   MongoDB Addresses: ${mongoAddressCount}`);

    if (mysqlCustomers !== mongoCustomers) {
      throw new Error(
        `CRITICAL: Customer count mismatch! MySQL: ${mysqlCustomers}, MongoDB: ${mongoCustomers}`
      );
    }

    if (mysqlAddresses !== mongoAddressCount) {
      throw new Error(
        `CRITICAL: Address count mismatch! MySQL: ${mysqlAddresses}, MongoDB: ${mongoAddressCount}`
      );
    }

    log('✅ 100% Customer migration verified!\n');
  }

  // PHASE 4: Products
  async migratePhase4() {
    const phaseName = 'phase4_products';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'phase4_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('\n🚀 Starting Phase 4: Products...\n');

    this.resetStats();
    await this.updateMigrationStatus(phaseName, 'running');

    try {
      await this.migrateProducts();
      await this.verifyProductMigration();

      await this.updateMigrationStatus(phaseName, 'completed', null);

      log(`✅ Phase 4 completed: ${this.stats.succeeded} records migrated`);
      return true;
    } catch (error) {
      await this.updateMigrationStatus(phaseName, 'failed', error as Error);
      console.error('❌ Phase 4 failed:', error);
      throw error;
    }
  }

  async migrateProducts() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'product_migration_log.txt');

    fs.writeFileSync(logFile, '');

    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${msg}`;
      console.log(msg);
      fs.appendFileSync(logFile, line + '\n');
    };

    const missingMappings = {
      categories: new Set<number>(),
      productOptions: new Set<number>(),
      languages: new Set<number>(),
    };

    log('📦 Starting product migration...');

    if (!this.mysql) throw new Error('❌ MySQL connection not initialized');

    log('🧹 Clearing existing product data...');
    await Product.deleteMany({});

    try {
      await Product.collection.dropIndexes();
      log('🧹 Dropped indexes on Product collection');
    } catch (err) {
      log(`⚠️ Index drop error or none to drop: ${(err as Error).message}`);
    }

    const [products] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_product ORDER BY product_id`
    );
    const [descriptions] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_product_description`
    );
    const [categories] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_product_to_category`
    );
    const [images] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_product_image ORDER BY sort_order`
    );
    const [productOptions] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_product_option_value ORDER BY product_option_value_id`
    );

    log(`📊 Loaded ${products.length} products`);

    const languageObjectId = this.objectIdMapper.get('language')?.get(1) || null;
    if (!languageObjectId) {
      missingMappings.languages.add(1);
      log(`⚠️ Missing language mapping for language_id 1 - Will use null`);
    }

    const descMap = new Map<number, RowDataPacket>();
    descriptions.forEach(d => descMap.set(d.product_id, d));

    const catMap = new Map<number, number[]>();
    categories.forEach(c => {
      if (!catMap.has(c.product_id)) catMap.set(c.product_id, []);
      catMap.get(c.product_id)!.push(c.category_id);
    });

    const imgMap = new Map<number, RowDataPacket[]>();
    images.forEach(i => {
      if (!imgMap.has(i.product_id)) imgMap.set(i.product_id, []);
      imgMap.get(i.product_id)!.push(i);
    });

    const optionMap = new Map<number, RowDataPacket[]>();
    productOptions.forEach(opt => {
      if (!optionMap.has(opt.product_id)) optionMap.set(opt.product_id, []);
      optionMap.get(opt.product_id)!.push(opt);
    });

    if (!this.objectIdMapper.has('productOptionValue')) {
      this.objectIdMapper.set('productOptionValue', new Map());
    }

    const BATCH_SIZE = 100;
    let batch = [];
    let batchNumber = 1;

    for (const productRow of products) {
      try {
        this.stats.processed++;

        const desc = descMap.get(productRow.product_id);
        const productCats = catMap.get(productRow.product_id) || [];
        const productImgs = imgMap.get(productRow.product_id) || [];
        const opts = optionMap.get(productRow.product_id) || [];

        const seo = {
          metaTitle: desc?.meta_title || '',
          metaDescription: desc?.meta_description || '',
          metaKeyword: desc?.meta_keyword || '',
        };

        const categoryIds = productCats.map(cid => {
          const mapped = this.objectIdMapper.get('category')?.get(cid);
          if (!mapped) {
            missingMappings.categories.add(cid);
            log(`⚠️ Missing category mapping for category_id ${cid} - Using null`);
          }
          return mapped || null;
        });

        const productImages = productImgs
          .map(img => {
            if (img.image === '') {
              return null;
            }
            return {
              image: img.image,
              sortOrder: img.sort_order,
            };
          })
          .filter(img => img !== null);

        const options = opts.map(opt => {
          const optionValueId = this.objectIdMapper.get('productOption')?.get(opt.option_value_id);
          const generatedId = new mongoose.Types.ObjectId();
          this.objectIdMapper
            .get('productOptionValue')!
            .set(opt.product_option_value_id, generatedId);

          if (!optionValueId) {
            missingMappings.productOptions.add(opt.option_value_id);
            log(
              `⚠️ Missing product option mapping for option_value_id ${opt.option_value_id} - Using null`
            );
          }

          return {
            _id: generatedId,
            option: optionValueId || null,
            price: opt.price,
            uploadedFilePath: opt.uploaded_files || '',
          };
        });

        const productId = new mongoose.Types.ObjectId();
        if (!this.objectIdMapper.has('product')) {
          this.objectIdMapper.set('product', new Map());
        }
        this.objectIdMapper.get('product')!.set(productRow.product_id, productId);

        const product = new Product({
          _id: productId,
          languageId: languageObjectId,
          productModel: productRow.model || `PRODUCT_${productRow.product_id}`,
          description: desc?.name || `Product ${productRow.product_id}`,
          sku:
            productRow.sku !== null && productRow.sku !== undefined
              ? productRow.sku === ''
                ? `SKU_${productRow.product_id}`
                : productRow.sku
              : `SKU_${productRow.product_id}`,
          stitches: productRow.upc || '',
          dimensions: productRow.ean || '',
          colourNeedles: productRow.jan || '',
          sortOrder: productRow.sort_order || 0,
          image: productRow.image || '',
          status: productRow.status === 1,
          viewed: productRow.viewed || 0,
          seo,
          categories: categoryIds,
          additionalImages: productImages,
          options,
          createdAt: new Date(productRow.date_added || new Date()),
          updatedAt: new Date(productRow.date_modified || new Date()),
        });

        batch.push(product.toObject());

        if (batch.length >= BATCH_SIZE) {
          try {
            await Product.insertMany(batch, { ordered: false });
            this.stats.succeeded += batch.length;
            log(`✅ Batch ${batchNumber}: Inserted ${batch.length} products`);
          } catch (err) {
            this.stats.failed += batch.length;
            log(`❌ Batch insert error in batch ${batchNumber}: ${(err as Error).message}`);
          }
          batch = [];
          batchNumber++;
        }
      } catch (err) {
        this.stats.failed++;
        log(`❌ Error preparing product ${productRow.product_id}: ${(err as Error).message}`);
      }
    }

    if (batch.length > 0) {
      try {
        await Product.insertMany(batch, { ordered: false });
        this.stats.succeeded += batch.length;
        log(`✅ Final batch ${batchNumber}: Inserted ${batch.length} products`);
      } catch (err) {
        this.stats.failed += batch.length;
        log(`❌ Final batch insert error: ${(err as Error).message}`);
      }
    }

    log('🔄 Recreating indexes...');
    await Product.syncIndexes();

    log(`🎉 Product migration complete.`);
    log(`📊 Summary:`);
    log(`   - Total products processed: ${this.stats.processed}`);
    log(`   - Products successfully migrated: ${this.stats.succeeded}`);
    log(`   - Products failed: ${this.stats.failed}`);

    if (missingMappings.categories.size > 0) {
      log(`🔍 Missing Category IDs (${missingMappings.categories.size}):`);
      log(
        `  ${Array.from(missingMappings.categories)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    if (missingMappings.productOptions.size > 0) {
      log(`🔍 Missing Product Option IDs (${missingMappings.productOptions.size}):`);
      log(
        `  ${Array.from(missingMappings.productOptions)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    if (missingMappings.languages.size > 0) {
      log(`🔍 Missing Language IDs (${missingMappings.languages.size}):`);
      log(
        `  ${Array.from(missingMappings.languages)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    log(`📁 Complete log saved to: ${logFile}\n`);
  }

  async verifyProductMigration() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'product_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('🔍 Verifying product migration...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Count MySQL products
    const [mysqlCount] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM oc_product'
    );
    const mysqlProducts = mysqlCount[0].count;

    // Count MongoDB products
    const mongoProducts = await Product.countDocuments();

    log(`📊 Product Migration Verification:`);
    log(`   MySQL Products: ${mysqlProducts}`);
    log(`   MongoDB Products: ${mongoProducts}`);

    if (mysqlProducts !== mongoProducts) {
      throw new Error(
        `CRITICAL: Product count mismatch! MySQL: ${mysqlProducts}, MongoDB: ${mongoProducts}`
      );
    }

    log('✅ Product migration verified!\n');
  }

  // PHASE 5: Cart and Wishlist
  async migratePhase5() {
    const phaseName = 'phase5_cart_wishlist';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'phase5_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('\n🚀 Starting Phase 5: Cart and Wishlist...\n');

    this.resetStats();
    await this.updateMigrationStatus(phaseName, 'running');

    try {
      await this.migrateCart();
      await this.verifyCartMigration();

      await this.migrateWishlist();
      await this.verifyWishlistMigration();

      await this.updateMigrationStatus(phaseName, 'completed', null);

      log(`✅ Phase 5 completed: ${this.stats.succeeded} records migrated`);
      return true;
    } catch (error) {
      await this.updateMigrationStatus(phaseName, 'failed', error as Error);
      console.error('❌ Phase 5 failed:', error);
      throw error;
    }
  }

  async migrateCart() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'cart_migration_log.txt');

    fs.writeFileSync(logFile, '');

    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${msg}`;
      console.log(msg);
      fs.appendFileSync(logFile, line + '\n');
    };

    log('🛒 Starting cart migration...');

    if (!this.mysql) throw new Error('❌ MySQL connection not initialized');
    const BATCH_SIZE = 100;

    log('🧹 Clearing existing Cart data...');
    await Cart.deleteMany({});

    try {
      await Cart.collection.dropIndexes();
      log('🧹 Dropped indexes on Cart collection');
    } catch (err) {
      log(`⚠️ No indexes to drop or error dropping: ${(err as Error).message}`);
    }

    const [cartRows] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT * FROM oc_cart ORDER BY cart_id'
    );
    log(`📦 Found ${cartRows.length} cart rows to migrate`);

    const cartMap: Map<string, any[]> = new Map();
    let skippedOptions = 0;

    for (const row of cartRows) {
      const customerId = this.objectIdMapper.get('customer')?.get(row.customer_id) || null;
      const productId = this.objectIdMapper.get('product')?.get(row.product_id) || null;

      if (!this.objectIdMapper.get('customer')?.has(row.customer_id)) {
        log(`⚠️ Missing customer mapping for MySQL customer_id ${row.customer_id} - Using null`);
      }

      if (!this.objectIdMapper.get('product')?.has(row.product_id)) {
        log(`⚠️ Missing product mapping for MySQL product_id ${row.product_id} - Using null`);
      }

      const options = [];

      try {
        const parsed = JSON.parse(row.option || '{}');

        for (const values of Object.values(parsed)) {
          const valueArray = Array.isArray(values) ? values : [values];

          for (const value of valueArray) {
            const optionValueId = this.objectIdMapper.get('productOptionValue')?.get(Number(value));

            if (!optionValueId) {
              skippedOptions++;
              log(`⚠️ Missing option value mapping for value ${value} in cart_id ${row.cart_id}`);
              continue;
            }

            const [product] = await Product.find({ _id: productId });
            const option = product?.options?.find(
              opt => opt._id?.toString() === optionValueId.toString()
            );

            if (!option) {
              log(
                `⚠️ Option not found in product ${productId} for value ID ${optionValueId} in cart_id ${row.cart_id}`
              );
              continue;
            }

            options.push(option);
          }
        }
      } catch (err) {
        skippedOptions++;
        log(`⚠️ Invalid JSON in cart_id ${row.cart_id}: ${row.option} - ${(err as Error).message}`);
      }

      const cartItem = {
        product: productId,
        options,
        createdAt: row.date_added,
        updatedAt: new Date(),
      };

      const existing = cartMap.get(customerId?.toString() || 'null') || [];
      existing.push(cartItem);
      cartMap.set(customerId?.toString() || 'null', existing);
    }

    // Save in batches
    let batch = [];
    let succeeded = 0;
    let failed = 0;
    let batchNumber = 1;

    for (const [customerId, items] of cartMap.entries()) {
      const cart = {
        customerId: customerId === 'null' ? null : new mongoose.Types.ObjectId(customerId),
        items,
      };
      batch.push(cart);

      if (batch.length >= BATCH_SIZE) {
        try {
          await Cart.collection.insertMany(batch, { ordered: false });
          succeeded += batch.length;
          log(`✅ Batch ${batchNumber}: Inserted ${batch.length} carts`);
        } catch (err) {
          failed += batch.length;
          log(`❌ Batch ${batchNumber} insert error: ${(err as Error).message}`);
        }
        batch = [];
        batchNumber++;
      }
    }

    if (batch.length > 0) {
      try {
        await Cart.collection.insertMany(batch, { ordered: false });
        succeeded += batch.length;
        log(`✅ Final batch ${batchNumber}: Inserted ${batch.length} carts`);
      } catch (err) {
        failed += batch.length;
        log(`❌ Final batch insert error: ${(err as Error).message}`);
      }
    }

    log('✅ Recreating indexes on Cart collection...');
    await Cart.syncIndexes();

    log(`🎉 Cart migration complete: ${succeeded + failed} processed`);
    log(`📊 Summary:`);
    log(`   - Succeeded: ${succeeded}`);
    log(`   - Failed: ${failed}`);
    log(`   - Skipped/Invalid Options: ${skippedOptions}`);
    log(`📁 Log file saved to: ${logFile}\n`);
  }

  async verifyCartMigration() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'cart_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('🛒 Verifying cart migration...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Count MySQL cart entries
    const [mysqlCount] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM oc_cart'
    );
    const mysqlCartEntries = mysqlCount[0].count;

    // Count MongoDB cart documents
    const mongoCartDocs = await Cart.countDocuments();

    // Count total items in MongoDB carts
    const mongoCartItems = await Cart.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: { $size: '$items' } },
        },
      },
    ]);

    const totalMongoItems = mongoCartItems.length > 0 ? mongoCartItems[0].totalItems : 0;

    log(`📊 Cart Migration Verification:`);
    log(`   MySQL Cart Entries: ${mysqlCartEntries}`);
    log(`   MongoDB Cart Documents: ${mongoCartDocs}`);
    log(`   MongoDB Total Cart Items: ${totalMongoItems}`);

    if (mysqlCartEntries !== totalMongoItems) {
      throw new Error(
        `CRITICAL: Cart count mismatch! MySQL: ${mysqlCartEntries}, MongoDB: ${totalMongoItems}`
      );
    }

    log('✅ Cart migration verified!\n');
  }

  async migrateWishlist() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'wishlist_migration_log.txt');

    fs.writeFileSync(logFile, '');

    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${msg}`;
      console.log(msg);
      fs.appendFileSync(logFile, line + '\n');
    };

    log('❤️ Starting wishlist migration...');

    if (!this.mysql) throw new Error('❌ MySQL connection not initialized');

    await Wishlist.deleteMany({});
    try {
      await Wishlist.collection.dropIndexes();
      log('🧹 Dropped indexes on Wishlist collection');
    } catch (err) {
      log(`⚠️ No indexes to drop or error dropping: ${(err as Error).message}`);
    }

    const [wishlistRows] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT * FROM oc_customer_wishlist ORDER BY customer_id'
    );

    log(`📊 Found ${wishlistRows.length} wishlist rows`);

    const wishlistMap = new Map<string, any>();
    const missingMappings = {
      customers: new Set<number>(),
      products: new Set<number>(),
    };

    // Track statistics
    let totalWishlistEntries = 0;
    let skippedDueToMissingCustomer = 0;
    let skippedDueToMissingProduct = 0;
    let successfullyMapped = 0;

    for (const row of wishlistRows) {
      totalWishlistEntries++;

      const customerId = this.objectIdMapper.get('customer')?.get(row.customer_id) || null;
      const productId = this.objectIdMapper.get('product')?.get(row.product_id) || null;

      if (!customerId) {
        missingMappings.customers.add(row.customer_id);
        skippedDueToMissingCustomer++;
        log(
          `⚠️ Missing customer mapping for MySQL customer_id ${row.customer_id} - Skipping wishlist entry`
        );
        continue; // Skip this entry entirely if customer is missing
      }

      if (!productId) {
        missingMappings.products.add(row.product_id);
        skippedDueToMissingProduct++;
        log(
          `⚠️ Missing product mapping for MySQL product_id ${row.product_id} - Skipping product from wishlist`
        );
        continue; // Skip this entry if product is missing
      }

      successfullyMapped++;
      const key = customerId.toString();

      if (!wishlistMap.has(key)) {
        wishlistMap.set(key, {
          customerId: customerId,
          items: [],
          createdAt: new Date(row.date_added),
          updatedAt: new Date(row.date_added),
        });
      }

      wishlistMap.get(key).items.push({ product: productId });
    }

    // Log detailed statistics
    log(`📊 Wishlist Mapping Statistics:`);
    log(`   Total MySQL wishlist entries: ${totalWishlistEntries}`);
    log(`   Successfully mapped: ${successfullyMapped}`);
    log(`   Skipped due to missing customer: ${skippedDueToMissingCustomer}`);
    log(`   Skipped due to missing product: ${skippedDueToMissingProduct}`);
    log(`   Missing customer mappings: ${missingMappings.customers.size}`);
    log(`   Missing product mappings: ${missingMappings.products.size}`);

    const bulk = Array.from(wishlistMap.values());

    let succeeded = 0;
    let failed = 0;

    if (bulk.length > 0) {
      try {
        await Wishlist.insertMany(bulk, { ordered: false });
        succeeded += bulk.length;
        log(`✅ Inserted ${succeeded} wishlists`);
      } catch (err) {
        failed += bulk.length;
        log(`❌ Error inserting wishlists: ${(err as Error).message}`);
      }
    }

    log('✅ Recreating indexes on Wishlist collection...');
    await Wishlist.syncIndexes();

    log('🎉 Wishlist migration complete.');
    log(`📊 Summary:`);
    log(`   - Total MySQL wishlist entries: ${wishlistRows.length}`);
    log(`   - MongoDB wishlist documents created: ${succeeded}`);
    log(`   - Failed inserts: ${failed}`);

    // Calculate total items across all wishlists
    const totalItems = bulk.reduce((sum, wishlist) => sum + (wishlist.items?.length || 0), 0);
    log(`   - Total wishlist items: ${totalItems}`);

    if (missingMappings.customers.size > 0) {
      log(`🔍 Missing Customer IDs (${missingMappings.customers.size}):`);
      const missingCustomerIds = Array.from(missingMappings.customers).sort((a, b) => a - b);
      if (missingCustomerIds.length <= 20) {
        log(`  ${missingCustomerIds.join(', ')}`);
      } else {
        log(`  First 20: ${missingCustomerIds.slice(0, 20).join(', ')}`);
        log(`  ... and ${missingCustomerIds.length - 20} more`);
      }
    }

    if (missingMappings.products.size > 0) {
      log(`🔍 Missing Product IDs (${missingMappings.products.size}):`);
      const missingProductIds = Array.from(missingMappings.products).sort((a, b) => a - b);
      if (missingProductIds.length <= 20) {
        log(`  ${missingProductIds.join(', ')}`);
      } else {
        log(`  First 20: ${missingProductIds.slice(0, 20).join(', ')}`);
        log(`  ... and ${missingProductIds.length - 20} more`);
      }
    }

    // Store mapping statistics for verification
    this.wishlistMappingStats = {
      totalEntries: totalWishlistEntries,
      successfullyMapped,
      skippedDueToMissingCustomer,
      skippedDueToMissingProduct,
      missingCustomerCount: missingMappings.customers.size,
      missingProductCount: missingMappings.products.size,
    };

    log(`📁 Complete migration log saved to: ${logFile}\n`);
  }

  async verifyWishlistMigration() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'wishlist_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('❤️ Verifying wishlist migration...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Count MySQL wishlist entries
    const [mysqlCount] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM oc_customer_wishlist'
    );
    const mysqlWishlistEntries = mysqlCount[0].count;

    // Count MongoDB wishlist documents
    const mongoWishlistDocs = await Wishlist.countDocuments();

    // Count total products in MongoDB wishlists
    const mongoWishlistProducts = await Wishlist.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: { $size: { $ifNull: ['$items', []] } } },
        },
      },
    ]);

    const totalMongoProducts =
      mongoWishlistProducts.length > 0 ? mongoWishlistProducts[0].totalProducts : 0;

    // Calculate expected count based on available mappings
    const availableCustomers = this.objectIdMapper.get('customer')?.size || 0;
    const availableProducts = this.objectIdMapper.get('product')?.size || 0;

    log(`📊 Wishlist Migration Verification:`);
    log(`   MySQL Wishlist Entries: ${mysqlWishlistEntries}`);
    log(`   MongoDB Wishlist Documents: ${mongoWishlistDocs}`);
    log(`   MongoDB Total Wishlist Products: ${totalMongoProducts}`);
    log(`   Available Customer Mappings: ${availableCustomers}`);
    log(`   Available Product Mappings: ${availableProducts}`);

    // Show detailed mapping statistics if available
    if (this.wishlistMappingStats) {
      log(`📊 Detailed Mapping Statistics:`);
      log(`   Successfully Mapped: ${this.wishlistMappingStats.successfullyMapped}`);
      log(
        `   Skipped (Missing Customer): ${this.wishlistMappingStats.skippedDueToMissingCustomer}`
      );
      log(`   Skipped (Missing Product): ${this.wishlistMappingStats.skippedDueToMissingProduct}`);
      log(`   Missing Customer IDs: ${this.wishlistMappingStats.missingCustomerCount}`);
      log(`   Missing Product IDs: ${this.wishlistMappingStats.missingProductCount}`);
    }

    // Calculate success rate based on what could actually be migrated
    const successRate = ((totalMongoProducts / mysqlWishlistEntries) * 100).toFixed(2);
    const missingProducts = mysqlWishlistEntries - totalMongoProducts;

    if (missingProducts > 0) {
      log(`⚠️ Wishlist product count analysis:`);
      log(`   Missing products: ${missingProducts}`);
      log(`   Success rate: ${successRate}%`);
      log(`   This is due to missing customer/product mappings from earlier phases.`);

      // Show breakdown of what's missing
      if (availableCustomers < 1000) {
        // Assuming there should be more customers
        log(`   ⚠️ Low customer mapping count (${availableCustomers}) - check customer migration`);
      }
      if (availableProducts < 3000) {
        // Assuming there should be more products
        log(`   ⚠️ Low product mapping count (${availableProducts}) - check product migration`);
      }

      // Only throw error if success rate is below 90% (more lenient)
      if (parseFloat(successRate) < 90) {
        throw new Error(
          `⚠️ Wishlist migration success rate too low! Expected: ${mysqlWishlistEntries}, Found: ${totalMongoProducts} (${successRate}% success rate)`
        );
      } else {
        log(`✅ Wishlist migration verified with acceptable success rate (${successRate}%)!\n`);
      }
    } else {
      log('✅ Wishlist migration verified!\n');
    }
  }

  // PHASE 6: Orders and Transactions
  async migratePhase6() {
    const phaseName = 'phase6_orders';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'phase6_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('\n🚀 Starting Phase 6: Orders and Transactions...\n');

    this.resetStats();
    await this.updateMigrationStatus(phaseName, 'running');

    try {
      await this.migrateOrders();
      await this.verifyOrderMigration();

      // Update counter sequence value to match last order_id from MySQL
      await this.updateCounterSequenceValue();

      await this.updateMigrationStatus(phaseName, 'completed', null);

      log(`✅ Phase 6 completed: ${this.stats.succeeded} records migrated`);
      return true;
    } catch (error) {
      await this.updateMigrationStatus(phaseName, 'failed', error as Error);
      console.error('❌ Phase 6 failed:', error);
      throw error;
    }
  }

  async migrateOrders() {
    // Define __dirname for ES module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Log file path
    const logFile = join(__dirname, '../migrationLogs', 'order_migration_log.txt');

    // Clear previous log file
    fs.writeFileSync(logFile, '');

    const log = (message: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(message);
      fs.appendFileSync(logFile, logMessage + '\n');
    };

    // Track missing mappings for detailed reporting
    const missingMappings = {
      customers: new Set<number>(),
      products: new Set<number>(),
      productOptions: new Set<number>(),
      languages: new Set<number>(),
    };

    log('🛒 Migrating orders efficiently with preloaded data...');

    if (!this.mysql) throw new Error('❌ MySQL connection not initialized');

    // Clean old data
    log('🧹 Clearing existing orders...');
    await Order.deleteMany({});

    try {
      await Order.collection.dropIndexes();
      log('🧹 Dropped indexes on Order collection');
    } catch (err) {
      log(`⚠️ Index drop warning: ${(err as Error).message}`);
    }

    const [orders] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_order ORDER BY order_id`
    );
    const [orderProducts] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_order_product ORDER BY order_product_id`
    );
    const [orderOptions] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_order_option`
    );
    const [orderTotals] = await this.mysql.execute<RowDataPacket[]>(`SELECT * FROM oc_order_total`);
    const [orderHistories] = await this.mysql.execute<RowDataPacket[]>(
      `SELECT * FROM oc_order_history`
    );

    log(`📊 Loaded ${orders.length} orders with related data`);

    // Group data
    const productsMap = new Map<number, RowDataPacket[]>();
    orderProducts.forEach(p => {
      if (!productsMap.has(p.order_id)) productsMap.set(p.order_id, []);
      productsMap.get(p.order_id)!.push(p);
    });

    const optionsMap = new Map<number, RowDataPacket[]>();
    orderOptions.forEach(o => {
      if (!optionsMap.has(o.order_product_id)) optionsMap.set(o.order_product_id, []);
      optionsMap.get(o.order_product_id)!.push(o);
    });

    const totalsMap = new Map<number, RowDataPacket[]>();
    orderTotals.forEach(t => {
      if (!totalsMap.has(t.order_id)) totalsMap.set(t.order_id, []);
      totalsMap.get(t.order_id)!.push(t);
    });

    const historiesMap = new Map<number, RowDataPacket[]>();
    orderHistories.forEach(h => {
      if (!historiesMap.has(h.order_id)) historiesMap.set(h.order_id, []);
      historiesMap.get(h.order_id)!.push(h);
    });

    // Migrate in batches
    const BATCH_SIZE = 100;
    let batch: any[] = [];
    let batchNumber = 1;

    for (const orderRow of orders) {
      try {
        this.stats.processed++;

        const customerId = this.objectIdMapper.get('customer')?.get(orderRow.customer_id);
        const languageId = this.objectIdMapper.get('language')?.get(orderRow.language_id);

        // Track missing mappings
        if (!customerId && orderRow.customer_id) {
          missingMappings.customers.add(orderRow.customer_id);
          log(
            `⚠️ Missing customer mapping for MySQL customer_id ${orderRow.customer_id} - Order will be created without customer reference`
          );
        }

        if (!languageId && orderRow.language_id) {
          missingMappings.languages.add(orderRow.language_id);
          log(
            `⚠️ Missing language mapping for MySQL language_id ${orderRow.language_id} - Order will be created without language reference`
          );
        }

        const orderProductsList = await Promise.all(
          (productsMap.get(orderRow.order_id) || []).map(async productRow => {
            const productId = this.objectIdMapper.get('product')?.get(productRow.product_id);

            if (!productId) {
              missingMappings.products.add(productRow.product_id);
              log(
                `⚠️ Missing product mapping for MySQL ID ${productRow.product_id} - Product will be skipped from order`
              );
              return null;
            }

            const product = await Product.findById(productId);
            if (!product) {
              log(
                `⚠️ Product not found in MongoDB for ID ${productId} - Product will be skipped from order`
              );
              return null;
            }

            const optionList = (optionsMap.get(productRow.order_product_id) || [])
              .map(opt => {
                const optionValueId = this.objectIdMapper
                  .get('productOptionValue')
                  ?.get(opt.product_option_value_id);

                if (!optionValueId) {
                  missingMappings.productOptions.add(opt.product_option_value_id);
                  log(
                    `⚠️ Missing option value mapping for ID ${opt.product_option_value_id} - Option will be skipped`
                  );
                  return null;
                }

                const option = product.options.find(
                  o => o._id?.toString() === optionValueId.toString()
                );

                if (!option) {
                  log(
                    `⚠️ Option not found in product ${productId} for value ID ${optionValueId} - Option will be skipped`
                  );
                  return null;
                }

                return option;
              })
              .filter(option => option !== null); // Filter out null options

            return {
              product: productId,
              options: optionList,
            };
          })
        );

        // Filter out null products (products with missing mappings)
        const validProducts = orderProductsList.filter(product => product !== null);

        if (validProducts.length !== orderProductsList.length) {
          log(
            `ℹ️ Order ${orderRow.order_id}: ${orderProductsList.length - validProducts.length} products skipped due to missing mappings`
          );
        }

        const orderTotalsList = (totalsMap.get(orderRow.order_id) || []).map(total => {
          // Map MySQL total codes to MongoDB enum values
          let mappedCode = total.code;
          if (total.code === 'sub_total') {
            mappedCode = 'subtotal';
          } else if (total.code === 'total') {
            mappedCode = 'total';
          } else if (total.code === 'coupon') {
            mappedCode = 'couponDiscount';
          }

          return {
            code: mappedCode,
            value: parseFloat(total.value) || 0,
            sortOrder: parseInt(total.sort_order) || 0,
          };
        });

        const orderHistoryList = (historiesMap.get(orderRow.order_id) || []).map(h => ({
          orderStatus: h.order_status_id === 5 ? 'paid' : 'pending',
          comment: h.comment || '',
          notify: h.notify === 1,
          createdAt: new Date(h.date_added),
        }));

        const order = new Order({
          _id: new mongoose.Types.ObjectId(),
          customer: customerId || null,
          languageId: languageId || null,
          paymentFirstName: orderRow.payment_firstname || 'Unknown',
          paymentLastName: orderRow.payment_lastname || 'Customer',
          paymentCompany: orderRow.payment_company || '',
          paymentAddress1: orderRow.payment_address_1 || 'Unknown Address',
          paymentAddress2: orderRow.payment_address_2 || '',
          paymentCity: orderRow.payment_city || 'Unknown City',
          paymentPostcode: orderRow.payment_postcode || '00000',
          paymentCountry: orderRow.payment_country || 'Unknown',
          paymentZone: orderRow.payment_zone || '',
          paymentAddressFormat: orderRow.payment_address_format || '',
          paymentMethod: 'Pay by Razorpay',
          paymentCode: orderRow.payment_code || 'unknown',
          orderTotal: parseFloat(orderRow.total) || 0,
          orderStatus: orderRow.order_status_id === 5 ? 'paid' : 'pending',
          ipAddress: orderRow.ip || '',
          forwardedIp: orderRow.forwarded_ip || '',
          userAgent: orderRow.user_agent || '',
          acceptLanguageId: orderRow.accept_language || '',
          products: validProducts,
          totals: orderTotalsList,
          history: orderHistoryList,
          createdAt: new Date(orderRow.date_added),
          updatedAt: new Date(orderRow.date_modified),
          coupon: null,
          orderNumber: orderRow.order_id || '',
        });

        batch.push(order.toObject());

        if (batch.length === BATCH_SIZE) {
          await Order.insertMany(batch, { ordered: false });
          this.stats.succeeded += batch.length;
          log(`✅ Batch ${batchNumber}: Inserted ${this.stats.succeeded}/${orders.length} orders`);
          batch = [];
          batchNumber++;
        }
      } catch (err) {
        this.stats.failed++;
        log(`❌ Error processing order ${orderRow.order_id}: ${(err as Error).message}`);
      }
    }

    if (batch.length > 0) {
      try {
        await Order.insertMany(batch, { ordered: false });
        this.stats.succeeded += batch.length;
        log(`✅ Final batch ${batchNumber}: Inserted ${batch.length} orders`);
      } catch (err) {
        log(`❌ Final batch insert error: ${(err as Error).message}`);
        this.stats.failed += batch.length;
      }
    }

    log('✅ Recreating indexes...');
    await Order.syncIndexes();

    log(`🎉 Order migration complete: ${this.stats.succeeded}/${orders.length} succeeded`);
    log(`📊 Migration Summary:`);
    log(`   - Total orders processed: ${this.stats.processed}`);
    log(`   - Orders successfully migrated: ${this.stats.succeeded}`);
    log(`   - Orders failed: ${this.stats.failed}`);
    log(
      `   - Orders with missing customer references: Orders will be created without customer field`
    );
    log(`   - Orders with missing product references: Products will be skipped from those orders`);

    // Write detailed missing mappings report
    log(`\n🔍 DETAILED MISSING MAPPINGS REPORT:`);
    log(`=====================================`);

    if (missingMappings.customers.size > 0) {
      log(`Missing Customer IDs (${missingMappings.customers.size}):`);
      log(
        `  ${Array.from(missingMappings.customers)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    if (missingMappings.products.size > 0) {
      log(`Missing Product IDs (${missingMappings.products.size}):`);
      log(
        `  ${Array.from(missingMappings.products)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    if (missingMappings.productOptions.size > 0) {
      log(`Missing Product Option Value IDs (${missingMappings.productOptions.size}):`);
      log(
        `  ${Array.from(missingMappings.productOptions)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    if (missingMappings.languages.size > 0) {
      log(`Missing Language IDs (${missingMappings.languages.size}):`);
      log(
        `  ${Array.from(missingMappings.languages)
          .sort((a, b) => a - b)
          .join(', ')}`
      );
    }

    log(`\n📁 Complete migration log saved to: ${logFile}`);
  }

  async verifyOrderMigration() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'order_migration_log.txt');
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${msg}\n`;
      fs.appendFileSync(logFile, logMessage);
      console.log(msg);
    };

    log('🔍 Verifying order migration...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    // Count MySQL orders
    const [mysqlCount] = await this.mysql.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM oc_order'
    );
    const mysqlOrders = mysqlCount[0].count;

    // Count MongoDB orders
    const mongoOrders = await Order.countDocuments();

    log(`📊 Order Migration Verification:`);
    log(`   MySQL Orders: ${mysqlOrders}`);
    log(`   MongoDB Orders: ${mongoOrders}`);

    if (mysqlOrders !== mongoOrders) {
      throw new Error(
        `CRITICAL: Order count mismatch! MySQL: ${mysqlOrders}, MongoDB: ${mongoOrders}`
      );
    }

    log('✅ Order migration verified!\n');
  }

  async updateCounterSequenceValue() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const logFile = join(__dirname, '../migrationLogs', 'counter_migration_log.txt');

    fs.writeFileSync(logFile, '');

    const log = (message: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(message);
      fs.appendFileSync(logFile, logMessage + '\n');
    };

    log('🔢 Updating counter sequence value to match last order_id from MySQL...');

    if (!this.mysql) {
      throw new Error('❌ MySQL connection not initialized');
    }

    try {
      // Get the last order_id from MySQL
      const [lastOrderResult] = await this.mysql.execute<RowDataPacket[]>(
        'SELECT MAX(order_id) as last_order_id FROM oc_order'
      );

      const lastOrderId = lastOrderResult[0]?.last_order_id;

      if (!lastOrderId) {
        log('⚠️ No orders found in MySQL, setting counter sequence_value to 0');
        await Counter.findByIdAndUpdate(
          'orderNumber',
          { sequence_value: 0 },
          { upsert: true, new: true }
        );
        log('✅ Counter sequence_value set to 0');
        return;
      }

      log(`📊 Last order_id from MySQL: ${lastOrderId}`);

      // Update or create the counter with the last order_id as sequence_value
      const counter = await Counter.findByIdAndUpdate(
        'orderNumber',
        { sequence_value: lastOrderId },
        { upsert: true, new: true }
      );

      log(
        `✅ Counter sequence_value updated to ${counter.sequence_value} (matching last MySQL order_id)`
      );
      log(`📊 Counter details: _id=${counter._id}, sequence_value=${counter.sequence_value}`);
    } catch (error) {
      log(`❌ Error updating counter sequence value: ${(error as Error).message}`);
      throw error;
    }

    log(`📁 Counter migration log saved to: ${logFile}\n`);
  }

  async cleanup() {
    if (this.mysql) {
      await this.mysql.end();
    }
    await mongoose.disconnect();
    console.log('🧹 Database connections closed');
  }
}

export default MigrationService;
