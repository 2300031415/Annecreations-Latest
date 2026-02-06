// scripts/generateCustomerMigrationSummary.ts
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationSummary {
  totalCustomers: number;
  invalidEmails: number;
  duplicateEmails: number;
  emptyEmails: number;
  successfulMigrations: number;
  failedMigrations: number;
  invalidEmailCustomers: Array<{
    customerId: number;
    originalEmail: string;
    generatedEmail: string;
  }>;
  duplicateEmailCustomers: Array<{
    customerId: number;
    originalEmail: string;
    uniqueEmail: string;
  }>;
  emptyEmailCustomers: Array<{
    customerId: number;
    reason: string;
    originalEmail: string;
    generatedEmail: string;
  }>;
  migrationStats: {
    startTime: string;
    endTime: string;
    duration: string;
    batchesProcessed: number;
  };
}

function parseMigrationLog(logContent: string): MigrationSummary {
  const lines = logContent.split('\n');
  const summary: MigrationSummary = {
    totalCustomers: 0,
    invalidEmails: 0,
    duplicateEmails: 0,
    emptyEmails: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    invalidEmailCustomers: [],
    duplicateEmailCustomers: [],
    emptyEmailCustomers: [],
    migrationStats: {
      startTime: '',
      endTime: '',
      duration: '',
      batchesProcessed: 0,
    },
  };

  let startTime = '';
  let endTime = '';

  for (const line of lines) {
    // Extract start time
    if (line.includes('Migrating customers with addresses')) {
      const match = line.match(/\[([^\]]+)\]/);
      if (match) startTime = match[1];
    }

    // Extract total customers
    const totalMatch = line.match(/Found (\d+) customers to migrate/);
    if (totalMatch) {
      summary.totalCustomers = parseInt(totalMatch[1]);
    }

    // Extract empty email customers (no email data)
    const emptyMatch = line.match(
      /Customer (\d+) - no email data \(empty\/null\) - generated: (.+)/
    );
    if (emptyMatch) {
      summary.emptyEmails++;
      summary.emptyEmailCustomers.push({
        customerId: parseInt(emptyMatch[1]),
        reason: 'No email data (empty/null)',
        originalEmail: '',
        generatedEmail: emptyMatch[2],
      });
    }

    // Extract invalid email format customers
    const invalidMatch = line.match(
      /Customer (\d+) had invalid email format, generated: (.+) - Original: "(.+)"/
    );
    if (invalidMatch) {
      summary.invalidEmails++;
      summary.invalidEmailCustomers.push({
        customerId: parseInt(invalidMatch[1]),
        originalEmail: invalidMatch[3],
        generatedEmail: invalidMatch[2],
      });
    }

    // Extract duplicate email customers (database level)
    const duplicateMatch = line.match(
      /Customer (\d+) had duplicate email in database, made unique: (.+) - Original: "(.+)"/
    );
    if (duplicateMatch) {
      summary.duplicateEmails++;
      summary.duplicateEmailCustomers.push({
        customerId: parseInt(duplicateMatch[1]),
        originalEmail: duplicateMatch[3],
        uniqueEmail: duplicateMatch[2],
      });
    }

    // Extract duplicate email customers (batch level)
    const batchDuplicateMatch = line.match(
      /Customer (\d+) had duplicate email in current batch, made unique: (.+) - Original: "(.+)"/
    );
    if (batchDuplicateMatch) {
      summary.duplicateEmails++;
      summary.duplicateEmailCustomers.push({
        customerId: parseInt(batchDuplicateMatch[1]),
        originalEmail: batchDuplicateMatch[3],
        uniqueEmail: batchDuplicateMatch[2],
      });
    }

    // Count successful batches
    if (line.includes('Inserted batch') && line.includes('successful')) {
      summary.migrationStats.batchesProcessed++;
    }

    // Extract end time from last batch
    if (line.includes('Inserted final batch')) {
      const match = line.match(/\[([^\]]+)\]/);
      if (match) endTime = match[1];
    }
  }

  // Calculate successful migrations (total customers - failed - empty emails)
  summary.successfulMigrations =
    summary.totalCustomers - summary.failedMigrations - summary.emptyEmails;

  // Calculate duration
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    summary.migrationStats.duration = `${minutes}m ${seconds}s`;
    summary.migrationStats.startTime = startTime;
    summary.migrationStats.endTime = endTime;
  }

  return summary;
}

function generateSummaryReport(summary: MigrationSummary): string {
  const report = `
# Customer Migration Summary Report
Generated on: ${new Date().toISOString()}

## 📊 Migration Overview
- **Total Customers Processed**: ${summary.totalCustomers.toLocaleString()}
- **Successfully Migrated**: ${summary.successfulMigrations.toLocaleString()}
- **Failed Migrations**: ${summary.failedMigrations.toLocaleString()}
- **Success Rate**: ${((summary.successfulMigrations / summary.totalCustomers) * 100).toFixed(2)}%

## ⚠️ Email Issues Summary
- **Empty Emails (No Email Data)**: ${summary.emptyEmails.toLocaleString()} (${((summary.emptyEmails / summary.totalCustomers) * 100).toFixed(2)}%)
- **Invalid Email Format**: ${summary.invalidEmails.toLocaleString()} (${((summary.invalidEmails / summary.totalCustomers) * 100).toFixed(2)}%)
- **Duplicate Emails**: ${summary.duplicateEmails.toLocaleString()} (${((summary.duplicateEmails / summary.totalCustomers) * 100).toFixed(2)}%)
- **Total Email Issues**: ${(summary.emptyEmails + summary.invalidEmails + summary.duplicateEmails).toLocaleString()}

## 🕒 Migration Performance
- **Start Time**: ${summary.migrationStats.startTime}
- **End Time**: ${summary.migrationStats.endTime}
- **Duration**: ${summary.migrationStats.duration}
- **Batches Processed**: ${summary.migrationStats.batchesProcessed}

## ⏭️ Empty Email Customers Details
${
  summary.emptyEmails > 0
    ? `
The following customers had no email data and were assigned generated emails:

| Customer ID | Generated Email | Reason |
|-------------|-----------------|--------|
${summary.emptyEmailCustomers
  .map(customer => `| ${customer.customerId} | ${customer.generatedEmail} | ${customer.reason} |`)
  .join('\n')}

**Note**: These customers were migrated with generated email addresses and will need to update their information.
`
    : 'No customers had empty emails.'
}

## 📋 Invalid Email Format Details
${
  summary.invalidEmails > 0
    ? `
The following customers had invalid email format (missing @ symbol) and were assigned generated emails:

| Customer ID | Original Email | Generated Email |
|-------------|----------------|-----------------|
${summary.invalidEmailCustomers
  .map(
    customer =>
      `| ${customer.customerId} | "${customer.originalEmail}" | ${customer.generatedEmail} |`
  )
  .join('\n')}

**Note**: These customers will need to update their email addresses in the new system.
`
    : 'No invalid email formats found.'
}

## 🔄 Duplicate Email Details
${
  summary.duplicateEmails > 0
    ? `
The following customers had duplicate email addresses that were made unique:

| Customer ID | Original Email | Unique Email |
|-------------|----------------|--------------|
${summary.duplicateEmailCustomers
  .map(
    customer => `| ${customer.customerId} | "${customer.originalEmail}" | ${customer.uniqueEmail} |`
  )
  .join('\n')}

**Note**: These customers had duplicate emails either in the database or within the same migration batch. They will need to verify their email addresses in the new system.
`
    : 'No duplicate emails found.'
}

## 🎯 Recommendations

### For Empty Email Customers:
1. **Contact customers** through alternative means (phone, address) to collect email
2. **Send notification emails** to the generated addresses explaining the situation
3. **Implement email verification** process for these customers
4. **Consider data quality improvements** in the source system to prevent future issues

### For Invalid Email Format:
1. **Contact customers** with invalid email formats to update their information
2. **Send notification emails** to the generated addresses explaining the situation
3. **Implement email verification** process for these customers
4. **Consider data cleanup** in the source system to prevent future issues

### For Duplicate Emails:
1. **Verify customer identity** for accounts with duplicate emails
2. **Implement account merging** if the same person has multiple accounts
3. **Send verification emails** to confirm email ownership
4. **Consider implementing** email change functionality
5. **Note**: Duplicates can occur at two levels:
   - **Database level**: Email already exists in MongoDB from previous migrations
   - **Batch level**: Multiple customers in the same migration batch had the same email

### General Recommendations:
1. **Monitor customer login attempts** for accounts with generated emails
2. **Implement email verification workflow** for all migrated customers
3. **Set up automated notifications** for customers with email issues
4. **Consider data quality improvements** in the source system
5. **Document the migration process** for future reference

## 📈 Migration Quality Metrics
- **Data Integrity**: ${summary.successfulMigrations === summary.totalCustomers ? '✅ 100%' : '⚠️ Partial'}
- **Email Quality**: ${(((summary.totalCustomers - summary.emptyEmails - summary.invalidEmails - summary.duplicateEmails) / summary.totalCustomers) * 100).toFixed(2)}%
- **Migration Efficiency**: ${summary.migrationStats.batchesProcessed > 0 ? '✅ Successful' : '❌ Failed'}

---
*Report generated automatically from migration logs*
`;

  return report;
}

async function main() {
  try {
    console.log('📊 Generating Customer Migration Summary...\n');

    // Read the migration log file
    const logFilePath = path.join(__dirname, '../migrationLogs/customer_migration_log.txt');

    if (!fs.existsSync(logFilePath)) {
      console.error('❌ Migration log file not found:', logFilePath);
      process.exit(1);
    }

    const logContent = fs.readFileSync(logFilePath, 'utf-8');

    // Parse the log and generate summary
    const summary = parseMigrationLog(logContent);

    // Generate the report
    const report = generateSummaryReport(summary);

    // Save the report
    const reportPath = path.join(__dirname, '../migrationLogs/customer_migration_summary.md');
    fs.writeFileSync(reportPath, report);

    // Also save as JSON for programmatic access
    const jsonPath = path.join(__dirname, '../migrationLogs/customer_migration_summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

    console.log('✅ Customer Migration Summary Generated Successfully!');
    console.log(`📄 Markdown Report: ${reportPath}`);
    console.log(`📊 JSON Data: ${jsonPath}`);
    console.log('\n📋 Summary:');
    console.log(`   Total Customers: ${summary.totalCustomers.toLocaleString()}`);
    console.log(`   Empty Emails: ${summary.emptyEmails.toLocaleString()}`);
    console.log(`   Invalid Email Format: ${summary.invalidEmails.toLocaleString()}`);
    console.log(`   Duplicate Emails: ${summary.duplicateEmails.toLocaleString()}`);
    console.log(
      `   Success Rate: ${((summary.successfulMigrations / summary.totalCustomers) * 100).toFixed(2)}%`
    );
    console.log(`   Duration: ${summary.migrationStats.duration}`);
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    process.exit(1);
  }
}

// Run the script
main();
