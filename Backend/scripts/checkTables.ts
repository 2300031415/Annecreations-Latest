import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import mysql, { RowDataPacket } from 'mysql2/promise';

dotenv.config();

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  const [tables] = await connection.execute<RowDataPacket[]>(`SHOW TABLES`);
  const tableKey = Object.keys(tables[0])[0];

  console.log(`📊 Row counts in ${process.env.MYSQL_DATABASE}:\n`);

  for (const row of tables) {
    const tableName = row[tableKey];
    const [countRes] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM \`${tableName}\``
    );
    console.log(`${tableName}: ${countRes[0].count}`);
  }

  await connection.end();
};

// Get the absolute path of the current module
const __filename = path.resolve(fileURLToPath(import.meta.url));

// Check if the script was run directly (not imported)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  run().catch(err => {
    console.error('❌ Error:', err.message);
  });
}
