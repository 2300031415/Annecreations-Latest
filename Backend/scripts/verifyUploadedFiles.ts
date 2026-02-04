// This script has been temporarily disabled due to type mismatches with the current model structure
// It needs to be updated to match the current Product and ProductOption models

/*
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';

import { connectMongoDB, connectMySQL } from '../config/db';
import Product from '../models/product.model';

class FileVerificationService {
  constructor() {
    this.mysql = null;
    this.uploadBaseDir = process.env.UPLOAD_DIR || './uploads';
    this.stats = {
      total_references: 0,
      files_found: 0,
      files_missing: 0,
      empty_references: 0,
    };
    this.missingFiles = [];
    this.foundFiles = [];
  }

  async initialize() {
    await connectMongoDB();
    this.mysql = await connectMySQL();

    // Ensure upload directory exists
    try {
      await fs.mkdir(this.uploadBaseDir, { recursive: true });
    } catch (error) {
      console.log('Upload directory exists or error creating:', (error as Error).message);
    }

    console.log('✅ Database connections and upload directory ready');
  }

  async verifyProductOptionFiles() {
    console.log('\n📁 Verifying Product Option Uploaded Files...\n');
    console.log('='.repeat(60));

    // Get all products with options that have uploaded files
    const products = await Product.find({
      'options.values.uploaded_file': { $exists: true, $ne: '' },
    });

    console.log(`📊 Found ${products.length} products with uploaded files to verify\n`);

    for (const product of products) {
      console.log(`\n🔍 Checking Product ID: ${product.product_id}`);

      for (const option of product.options) {
        if (option.values && option.values.length > 0) {
          for (const value of option.values) {
            if (value.uploaded_file && value.uploaded_file.trim() !== '') {
              await this.checkSingleFile(
                product.product_id,
                option.name,
                value.name,
                value.uploaded_file.trim(),
                value.product_option_value_id
              );
            }
          }
        }
      }
    }

    await this.generateReport();
  }

  async checkSingleFile(productId, optionName, valueName, fileName, optionValueId) {
    this.stats.total_references++;

    if (!fileName || fileName === '') {
      this.stats.empty_references++;
      return;
    }

    // Common upload paths to check
    const possiblePaths = [
      path.join(this.uploadBaseDir, fileName),
      path.join(this.uploadBaseDir, 'products', fileName),
      path.join(this.uploadBaseDir, 'options', fileName),
      path.join(this.uploadBaseDir, productId.toString(), fileName),
      path.join(process.cwd(), 'system', 'storage', 'upload', fileName),
      path.join(process.cwd(), 'image', 'catalog', fileName),
      path.join(process.cwd(), 'upload', fileName),
    ];

    let fileFound = false;
    let foundPath = null;

    for (const filePath of possiblePaths) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          fileFound = true;
          foundPath = filePath;
          break;
        }
      } catch (error) {
        // File doesn't exist at this path, continue to next
        continue;
      }
    }

    if (fileFound && foundPath) {
      this.stats.files_found++;
      console.log(`✅ Found: ${fileName}`);
      
      try {
        const fileStats = await fs.stat(foundPath);
        this.foundFiles.push({
          fileName,
          path: foundPath,
          size: fileStats.size,
          productId,
          optionName,
          valueName,
          optionValueId,
        });
      } catch (error) {
        console.error(`Error getting file stats for ${foundPath}:`, error);
      }
    } else {
      this.stats.files_missing++;
      console.log(`❌ Missing: ${fileName}`);
      this.missingFiles.push({
        fileName,
        productId,
        optionName,
        valueName,
        optionValueId,
      });
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total References: ${this.stats.total_references}`);
    console.log(`Files Found: ${this.stats.files_found}`);
    console.log(`Files Missing: ${this.stats.files_missing}`);
    console.log(`Empty References: ${this.stats.empty_references}`);
    console.log('='.repeat(60));

    if (this.missingFiles.length > 0) {
      console.log('\n❌ MISSING FILES:');
      console.log('-'.repeat(40));
      this.missingFiles.forEach(file => {
        console.log(`• ${file.fileName} (Product: ${file.productId}, Option: ${file.optionName}, Value: ${file.valueName})`);
      });
    }

    if (this.foundFiles.length > 0) {
      console.log('\n✅ FOUND FILES:');
      console.log('-'.repeat(40));
      this.foundFiles.forEach(file => {
        console.log(`• ${file.fileName} (${file.path}) - ${(file.size / 1024).toFixed(2)} KB`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  async cleanup() {
    if (this.mysql) {
      await this.mysql.end();
    }
    await mongoose.disconnect();
    console.log('✅ Database connections closed');
  }
}

// Main execution
async function main() {
  const service = new FileVerificationService();
  
  try {
    await service.initialize();
    await service.verifyProductOptionFiles();
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await service.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default FileVerificationService;
*/

console.log('File verification script temporarily disabled - needs model structure updates');
export default class FileVerificationService {
  constructor() {
    console.log('File verification script temporarily disabled');
  }

  async initialize() {
    console.log('File verification script temporarily disabled');
  }

  async verifyProductOptionFiles() {
    console.log('File verification script temporarily disabled');
  }

  async cleanup() {
    console.log('File verification script temporarily disabled');
  }
}
