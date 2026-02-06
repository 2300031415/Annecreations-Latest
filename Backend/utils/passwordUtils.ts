import { createHash } from 'crypto';

import bcrypt from 'bcrypt';

// Legacy OpenCart password hashing (for migration purposes only)
export function hashOpenCartPassword(password: string, salt: string): string {
  const first = sha1(password);
  const second = sha1(salt + first);
  const third = sha1(salt + second);
  return third;
}

function sha1(str: string): string {
  return createHash('sha1').update(str).digest('hex');
}

// Secure password hashing using bcrypt
export async function hashPassword(
  password: string,
  salt?: string
): Promise<{ hashedPassword: string; salt: string }> {
  if (salt) {
    // Legacy OpenCart compatibility
    const hashedPassword = hashOpenCartPassword(password, salt);
    return { hashedPassword, salt };
  } else {
    // New secure hashing
    const newSalt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, newSalt);
    return { hashedPassword, salt: newSalt };
  }
}

// Secure password comparison
export async function comparePassword(
  password: string,
  hashedPassword: string,
  salt?: string
): Promise<boolean> {
  if (salt && salt.length < 20) {
    // Legacy OpenCart comparison
    const newHashedPassword = hashOpenCartPassword(password, salt);
    return newHashedPassword === hashedPassword;
  } else {
    // Bcrypt comparison
    return await bcrypt.compare(password, hashedPassword);
  }
}

// Admin password hashing (secure)
export async function hashAdminPassword(
  password: string
): Promise<{ hashedPassword: string; salt: string }> {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  return { hashedPassword, salt };
}

// Admin password comparison (secure)
export async function compareAdminPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
