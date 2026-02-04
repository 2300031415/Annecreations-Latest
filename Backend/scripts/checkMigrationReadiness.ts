import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';
import { RowDataPacket } from 'mysql2';

import { connectMongoDB, connectMySQL } from '../config/db';
// Import all models to verify they exist
import Admin from '../models/admin.model';
import AuditLog from '../models/auditLog.model';
import Cart from '../models/cart.model';
import Category from '../models/category.model';
import Country from '../models/country.model';
import Customer from '../models/customer.model';
import Language from '../models/language.model';
import MigrationStatus from '../models/migrationStatus.model';
import OnlineUser from '../models/onlineUser.model';
import ProductOption from '../models/option.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import SearchLog from '../models/searchLog.model';
import UserActivity from '../models/userActivity.model';
import Wishlist from '../models/wishlist.model';
import Zone from '../models/zone.model';

const requiredTables = {
  phase1: ['oc_language', 'oc_country', 'oc_zone', 'oc_option_value_description'],
  phase2: ['oc_category', 'oc_category_description'],
  phase3: ['oc_user', 'oc_address', 'oc_customer'],
  phase4: [
    'oc_product',
    'oc_product_description',
    'oc_product_image',
    'oc_product_option_value',
    'oc_product_to_category',
  ],
  phase5: ['oc_cart', 'oc_customer_wishlist'],
  phase6: ['oc_order', 'oc_order_history', 'oc_order_option', 'oc_order_product', 'oc_order_total'],
};

const excludedTables = [
  // oldTables (legacy tables)
  'addproduct',
  'orders',
  'product_specifications',
  'register',

  // Session and API tables
  'oc_api',
  'oc_api_ip',
  'oc_api_session',

  // Custom fields and recurring (advanced features)
  'oc_attribute',
  'oc_attribute_description',
  'oc_attribute_group',
  'oc_attribute_group_description',
  'oc_banner',
  'oc_banner_image',

  // Unused
  'oc_category_filter',
  'oc_category_path',
  'oc_category_to_layout',
  'oc_category_to_store',

  // No coupons
  'oc_coupon',
  'oc_coupon_category',
  'oc_coupon_history',
  'oc_coupon_product',
  'oc_currency',

  // No custom fields
  'oc_custom_field',
  'oc_custom_field_customer_group',
  'oc_custom_field_description',
  'oc_custom_field_value',
  'oc_custom_field_value_description',

  'oc_customer_activity',
  'oc_customer_search',

  // Unused and no data
  'oc_customer_affiliate',
  'oc_customer_approval',
  'oc_customer_group',
  'oc_customer_group_description',
  'oc_customer_history',
  'oc_customer_ip',
  'oc_customer_login',
  'oc_customer_online',
  'oc_customer_reward',
  'oc_customer_transaction',
  'oc_download',
  'oc_download_description',
  'oc_event',
  'oc_extension',
  'oc_extension_install',
  'oc_extension_path',
  'oc_filter',
  'oc_filter_description',
  'oc_filter_group',
  'oc_filter_group_description',
  'oc_geo_zone',
  'oc_information',
  'oc_information_description',
  'oc_information_to_layout',
  'oc_information_to_store',
  'oc_layout',
  'oc_layout_module',
  'oc_layout_route',
  'oc_length_class',
  'oc_length_class_description',
  'oc_location',
  'oc_manufacturer',
  'oc_manufacturer_to_store',
  'oc_marketing',
  'oc_modification',
  'oc_module',
  'oc_option',
  'oc_option_description',
  'oc_option_value',
  'oc_order_recurring',
  'oc_order_recurring_transaction',
  'oc_order_shipment',
  'oc_order_status',
  'oc_order_voucher',
  'oc_product_attribute',
  'oc_product_discount',
  'oc_product_filter',
  'oc_product_image',
  'oc_product_recurring',
  'oc_product_related',
  'oc_product_reward',
  'oc_product_special',
  'oc_product_to_download',
  'oc_product_to_layout',
  'oc_product_to_store',
  'oc_recurring',
  'oc_recurring_description',
  'oc_return',
  'oc_return_action',
  'oc_return_history',
  'oc_return_reason',
  'oc_return_status',
  'oc_review',
  'oc_seo_url',
  'oc_shipping_courier',
  'oc_sms_template',
  'oc_sms_template_message',
  'oc_smsalert_notify',
  'oc_stock_status',
  'oc_store',
  'oc_tax_class',
  'oc_tax_rate',
  'oc_tax_rate_to_customer_group',
  'oc_tax_rule',
  'oc_theme',
  'oc_translation',
  'oc_tvcmsblog_comment',
  'oc_tvcmsblog_gallery',
  'oc_tvcmsblog_main',
  'oc_tvcmsblog_sub',
  'oc_tvcmsblogcategory_main',
  'oc_tvcmsblogcategory_sub',
  'oc_tvcmsbrandlist',
  'oc_tvcmscategoryslidermain',
  'oc_tvcmscategoryslidersub',
  'oc_tvcmsimageslidermain',
  'oc_tvcmsimageslidersub',
  'oc_tvcmsnewsletter',
  'oc_tvcmspaymenticonmain',
  'oc_tvcmspaymenticonsub',
  'oc_tvcmssocialiconmain',
  'oc_tvcmssocialiconsub',
  'oc_tvcmstags',
  'oc_tvcmstestimonialmain',
  'oc_tvcmstestimonialsub',
  'oc_tvcustomlink',
  'oc_upload',
  'oc_user_group',
  'oc_voucher',
  'oc_voucher_history',
  'oc_voucher_theme',
  'oc_voucher_theme_description',
  'oc_weight_class',
  'oc_weight_class_description',
];

async function checkModels() {
  console.log('🔍 Checking MongoDB Models...\n');

  const models = [
    { name: 'Admin', model: Admin },
    { name: 'AuditLog', model: AuditLog },
    { name: 'Cart', model: Cart },
    { name: 'Category', model: Category },
    { name: 'Country', model: Country },
    { name: 'Customer', model: Customer },
    { name: 'Language', model: Language },
    { name: 'MigrationStatus', model: MigrationStatus },
    { name: 'OnlineUser', model: OnlineUser },
    { name: 'Order', model: Order },
    { name: 'ProductOption', model: ProductOption },
    { name: 'Product', model: Product },
    { name: 'SearchLog', model: SearchLog },
    { name: 'UserActivity', model: UserActivity },
    { name: 'Wishlist', model: Wishlist },
    { name: 'Zone', model: Zone },
  ];

  let allModelsValid = true;

  for (const { name, model } of models) {
    try {
      // Check if schema exists
      const schema = model.schema;
      if (!schema || !(schema instanceof mongoose.Schema)) {
        throw new Error('Invalid or missing schema');
      }

      // Check if required fields have types
      Object.entries(schema.paths).forEach(([key, path]) => {
        if (!path.options || typeof path.options !== 'object') {
          throw new Error(`Invalid path options for key: ${key}`);
        }
      });
      console.log(`✅ ${name} model: OK`);
    } catch (error) {
      console.log(`❌ ${name} model is invalid: ${(error as Error).message}`);
      allModelsValid = false;
    }
  }

  return allModelsValid;
}

async function checkMySQLTables() {
  console.log('\n🔍 Checking MySQL Tables...\n');

  const mysql = await connectMySQL();

  try {
    // Get all tables in database
    const [tables] = await mysql.execute<RowDataPacket[]>('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    console.log(`📊 Found ${tableNames.length} tables in MySQL database\n`);

    // Check required tables by phase
    for (const [phase, phaseTables] of Object.entries(requiredTables)) {
      console.log(`\n--- ${phase.toUpperCase()} ---`);

      for (const tableName of phaseTables) {
        if (tableNames.includes(tableName)) {
          // Get row count
          const [countResult] = await mysql.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          const count = countResult[0].count;
          console.log(`✅ ${tableName}: ${count} records`);
        } else {
          console.log(`❌ ${tableName}: TABLE MISSING`);
        }
      }
    }

    // Show excluded tables (if they exist)
    console.log('\n--- EXCLUDED TABLES ---');
    for (const tableName of excludedTables) {
      if (tableNames.includes(tableName)) {
        const [countResult] = await mysql.execute<RowDataPacket[]>(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        const count = countResult[0].count;
        console.log(`⚠️  ${tableName}: ${count} records (EXCLUDED from migration)`);
      }
    }

    return tableNames;
  } finally {
    await mysql.end();
  }
}

async function main() {
  try {
    console.log('🚀 OpenCart to MongoDB Migration Readiness Check\n');
    console.log('================================================\n');

    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    // Check models
    const modelsValid = await checkModels();

    // Check MySQL tables
    const mysqlTables = await checkMySQLTables();

    console.log('\n================================================');
    console.log('📊 MIGRATION READINESS SUMMARY');
    console.log('================================================\n');

    console.log(`MongoDB Models: ${modelsValid ? '✅ READY' : '❌ ISSUES FOUND'}`);
    console.log(`MySQL Tables: ✅ ${mysqlTables.length} tables found`);
    console.log(`Required Tables: Check individual phase results above`);

    console.log('\n🎯 RECOMMENDED MIGRATION ORDER:');
    console.log('1. Phase 1: Core Independent Tables');
    console.log('2. Phase 2: Catagory Tables');
    console.log('3. Phase 3: User Management (Critical - ensure 100% customer migration)');
    console.log('4. Phase 4: Products');
    console.log('5. Phase 5: Cart and Wishlist');
    console.log('6. Phase 6: Orders');

    console.log('\n💡 NOTES:');
    console.log('- uploaded_files in oc_product_option_value will be transferred as-is');
    console.log('- File existence will be checked separately');
    console.log('- All customer records must be migrated (0% loss acceptable)');
    console.log('- Order integrity must be maintained');
  } catch (error) {
    console.error('❌ Error during migration check:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

// Get the absolute path of the current module
const __filename = path.resolve(fileURLToPath(import.meta.url));

// Check if the script was run directly (not imported)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

export { checkModels, checkMySQLTables, requiredTables, excludedTables };
