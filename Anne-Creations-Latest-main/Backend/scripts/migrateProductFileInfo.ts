#!/usr/bin/env node

/**
 * Migration script to add fileSize and mimeType to existing product options
 * Run this script after updating the product schema to populate missing file information
 */

import fs from 'fs';
import path from 'path';

import { connectMongoDB } from '../config/db';
import Product from '../models/product.model';
import { getMimeTypeFromExtension } from '../utils/fileUtils';

async function migrateProductFileInfo() {
  try {
    console.log('🔄 Starting migration to add fileSize and mimeType to existing products...');

    await connectMongoDB();
    console.log('✅ Connected to MongoDB');

    // Find all products with options that don't have fileSize or mimeType
    const products = await Product.find({
      'options.0': { $exists: true },
      $or: [{ 'options.fileSize': { $exists: false } }, { 'options.mimeType': { $exists: false } }],
    });

    console.log(`📦 Found ${products.length} products to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        let hasUpdates = false;

        for (const option of product.options) {
          if (option.uploadedFilePath) {
            // Get file stats if file exists
            if (fs.existsSync(option.uploadedFilePath)) {
              const stats = fs.statSync(option.uploadedFilePath);

              // Update fileSize if missing
              if (!option.fileSize) {
                option.fileSize = stats.size;
                hasUpdates = true;
              }

              // Update mimeType if missing
              if (!option.mimeType) {
                option.mimeType = getMimeTypeFromExtension(option.uploadedFilePath);
                hasUpdates = true;
              }
            } else {
              console.log(`⚠️  File not found: ${option.uploadedFilePath}`);

              // Set default values for missing files
              if (!option.fileSize) {
                option.fileSize = 0;
                hasUpdates = true;
              }
              if (!option.mimeType) {
                option.mimeType = getMimeTypeFromExtension(option.uploadedFilePath);
                hasUpdates = true;
              }
            }
          }
        }

        if (hasUpdates) {
          await product.save();
          updatedCount++;
          console.log(`✅ Updated product: ${product.productModel} (${product.sku})`);
        }
      } catch (error) {
        console.error(`❌ Error updating product ${product.sku}:`, error);
        errorCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`❌ Errors encountered: ${errorCount} products`);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateProductFileInfo();
}

export default migrateProductFileInfo;
