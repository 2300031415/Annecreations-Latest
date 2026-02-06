// scripts/runMigration.ts
import { mkdirSync, rmSync } from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

import MigrationService from '../services/migrationService';

import { checkModels, checkMySQLTables } from './checkMigrationReadiness';

dotenv.config();
type PhaseKey = keyof typeof AVAILABLE_PHASES;

const AVAILABLE_PHASES = {
  check: 'Run pre-migration checks',
  phase1: 'Core Independent Tables (countries, zones, etc.)',
  phase2: 'Catagory Tables',
  phase3: 'User Management (CRITICAL - customers & addresses)',
  phase4: 'Products (with full relationships)',
  phase5: 'Cart and Wishlist',
  phase6: 'Orders',
  all: 'Run all phases sequentially',
};

async function showUsage() {
  console.log('\n🚀 OpenCart to MongoDB Migration Tool\n');
  console.log('Usage: node scripts/runMigration.ts <phase>\n');
  console.log('Available phases:');

  for (const [phase, description] of Object.entries(AVAILABLE_PHASES)) {
    console.log(`  ${phase.padEnd(8)} - ${description}`);
  }

  console.log('\nExamples:');
  console.log('  node scripts/runMigration.ts check     # Check migration readiness');
  console.log('  node scripts/runMigration.ts phase1    # Migrate Phase 1 only');
  console.log('  node scripts/runMigration.ts phase2    # Migrate Catogories');
  console.log('  node scripts/runMigration.ts phase3    # Migrate customers (CRITICAL)');
  console.log('  node scripts/runMigration.ts phase4    # Migrate Products');
  console.log('  node scripts/runMigration.ts phase5    # Migrate Cart and Wishlist');
  console.log('  node scripts/runMigration.ts phase6    # Migrate Orders');
  console.log('  node scripts/runMigration.ts all       # Migrate all phases');
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('  - Phase 3 (customers) requires 100% success rate');
  console.log('  - uploaded_files in products will be transferred as-is');
  console.log('  - File verification should be done separately');
  console.log('  - Always run "check" before starting migration');
  console.log('');
}

async function runPreMigrationChecks() {
  console.log('🔍 Running Pre-Migration Checks...\n');
  console.log('='.repeat(50));

  try {
    // Check if models are properly configured
    console.log('📋 Checking MongoDB Models...');
    const modelsValid = await checkModels();

    if (!modelsValid) {
      console.log('❌ Model validation failed. Please fix model issues before migrating.');
      return false;
    }

    // Check MySQL tables
    console.log('\n📊 Checking MySQL Tables...');
    await checkMySQLTables();

    console.log('\n✅ Pre-migration checks completed successfully!');
    console.log('\n💡 Ready to proceed with migration phases.');
    console.log('   Recommended order: phase1 → phase2 → phase3 → phase4 → phase5 → phase6');

    return true;
  } catch (error) {
    console.error('\n❌ Pre-migration checks failed:', (error as Error).message);
    return false;
  }
}

async function runPhase(migration: MigrationService, phaseName: MigrationPhase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 STARTING ${phaseName.toUpperCase()}`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = new Date();
  let success = false;

  try {
    switch (phaseName) {
      case 'phase1':
        success = await migration.migratePhase1();
        break;
      case 'phase2':
        success = await migration.migratePhase2();
        break;
      case 'phase3':
        console.log('⚠️  CRITICAL PHASE: 100% customer migration required');
        success = await migration.migratePhase3();
        break;
      case 'phase4':
        success = await migration.migratePhase4();
        break;
      case 'phase5':
        success = await migration.migratePhase5();
        break;
      case 'phase6':
        success = await migration.migratePhase6();
        break;
      default:
        throw new Error(`Unknown phase: ${phaseName}`);
    }

    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    if (success) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ ${phaseName.toUpperCase()} COMPLETED SUCCESSFULLY`);
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(
        `📊 Records: ${migration.stats.succeeded} succeeded, ${migration.stats.failed} failed`
      );
      console.log(`${'='.repeat(60)}\n`);
    }

    return success;
  } catch (error) {
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`❌ ${phaseName.toUpperCase()} FAILED`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`💥 Error: ${(error as Error).message}`);
    console.log(`${'='.repeat(60)}\n`);

    return false;
  }
}

type MigrationPhase = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'phase6';

async function runAllPhases(migration: MigrationService) {
  console.log('\n🚀 Running ALL Migration Phases...\n');

  const phases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6'] as const;
  const results: Record<MigrationPhase, boolean> = {
    phase1: false,
    phase2: false,
    phase3: false,
    phase4: false,
    phase5: false,
    phase6: false,
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const logDir = join(__dirname, '../migrationLogs');

  // 🧹 Remove existing folder and contents, then recreate it cleanly
  rmSync(logDir, { recursive: true, force: true });
  mkdirSync(logDir, { recursive: true });

  for (const phase of phases) {
    const success = await runPhase(migration, phase);
    results[phase] = success;

    if (!success) {
      console.log(`❌ Migration failed at ${phase}. Stopping here.`);
      break;
    }

    // Small delay between phases
    console.log('⏳ Waiting 2 seconds before next phase...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Show final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));

  for (const [phase, success] of Object.entries(results)) {
    const status = success ? '✅ COMPLETED' : '❌ FAILED';
    console.log(`${phase.padEnd(10)} : ${status}`);
  }

  const allSuccessful = Object.values(results).every(success => success);

  if (allSuccessful) {
    console.log('\n🎉 ALL PHASES COMPLETED SUCCESSFULLY!');
    console.log('   Your OpenCart data has been fully migrated to MongoDB.');
  } else {
    console.log('\n⚠️  MIGRATION INCOMPLETE');
    console.log('   Some phases failed. Check the logs above for details.');
    console.log('   You can re-run individual phases that failed.');
  }

  console.log('='.repeat(60) + '\n');

  return allSuccessful;
}

async function main() {
  const phase = process.argv[2] as PhaseKey;

  if (!phase || !AVAILABLE_PHASES[phase]) {
    await showUsage();
    process.exit(1);
  }

  console.log('🏗️  OpenCart to MongoDB Migration');
  console.log('==================================\n');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🎯 Target phase: ${phase}`);
  console.log(`📝 Description: ${AVAILABLE_PHASES[phase]}\n`);

  // Special handling for check phase
  if (phase === 'check') {
    const checksPass = await runPreMigrationChecks();
    process.exit(checksPass ? 0 : 1);
  }

  const migration = new MigrationService();
  let success = false;

  try {
    // Initialize database connections
    console.log('🔗 Initializing database connections...');
    await migration.initialize();
    console.log('✅ Database connections established\n');

    if (phase === 'all') {
      success = await runAllPhases(migration);
    } else {
      success = await runPhase(migration, phase);
    }

    // Final status
    console.log('📅 Migration ended at:', new Date().toLocaleString());

    if (success) {
      console.log('🎉 Migration completed successfully!');

      if (phase === 'phase3' || phase === 'all') {
        console.log('\n💡 CUSTOMER MIGRATION NOTES:');
        console.log('   ✅ All customer records have been migrated');
        console.log('   ✅ Customer addresses are embedded in customer documents');
        console.log('   ✅ 100% data integrity maintained');
      }

      if (phase === 'phase4' || phase === 'all') {
        console.log('\n💡 PRODUCT MIGRATION NOTES:');
        console.log('   ✅ All product data migrated with embedded relationships');
        console.log('   ⚠️  uploaded_files references preserved (verify files separately)');
        console.log('   ✅ Product options and values fully migrated');
      }

      if (phase === 'phase5' || phase === 'all') {
        console.log('\n💡 CART & WISHLIST MIGRATION NOTES:');
        console.log('   ✅ Cart items migrated with product and option references');
        console.log('   ✅ Wishlist items migrated with customer and product references');
        console.log('   ✅ Verification checks completed for data integrity');
      }

      if (phase === 'phase6' || phase === 'all') {
        console.log('\n💡 ORDER MIGRATION NOTES:');
        console.log('   ✅ All orders migrated with embedded product data');
        console.log('   ✅ Order options and history preserved');
        console.log('   ✅ Both embedded and separate OrderProduct collections available');
      }
    } else {
      console.log('❌ Migration failed. Check the error messages above.');

      if (phase === 'phase3') {
        console.log('\n🚨 CUSTOMER MIGRATION FAILURE:');
        console.log('   This is a CRITICAL phase that requires 100% success');
        console.log('   Please resolve issues and retry before proceeding');
      }
    }
  } catch (error) {
    console.error('\n💥 Fatal error during migration:', (error as Error).message);
    console.error('Stack trace:', (error as Error).stack);
    success = false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up connections...');
    await migration.cleanup();
    console.log('✅ Cleanup completed');
  }

  const finalSuccess = success !== undefined ? success : false;
  process.exit(finalSuccess ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Get the absolute path of the current module
const __filename = path.resolve(fileURLToPath(import.meta.url));

// Check if the script was run directly (not imported)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  // Run main function
  main().catch(error => {
    console.error('Error in main:', error);
    process.exit(1);
  });
}
