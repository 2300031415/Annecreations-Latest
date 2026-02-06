// config/db.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import mysql from 'mysql2/promise';

dotenv.config();

export const connectMongoDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/anneCreations');
  console.log('✅ MongoDB connected');
};

export const connectMySQL = async () => {
  return await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
};
