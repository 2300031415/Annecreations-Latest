/**
 * Environment variable validation utility
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    defaultValue?: string;
  };
}

const requiredEnvVars: RequiredEnvVars = {
  MONGODB_URI: {
    required: true,
    description: 'MongoDB connection string',
  },
  JWT_SECRET: {
    required: true,
    description: 'JWT secret key for authentication',
  },
  RAZORPAY_KEY_ID: {
    required: false,
    description: 'Razorpay API key ID (optional - payment features will be disabled if not set)',
  },
  RAZORPAY_KEY_SECRET: {
    required: false,
    description:
      'Razorpay API key secret (optional - payment features will be disabled if not set)',
  },
  PORT: {
    required: false,
    description: 'Server port number',
    defaultValue: '5000',
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment (development/production)',
    defaultValue: 'development',
  },
  APP_NAME: {
    required: false,
    description: 'Application name for mobile app deep links',
    defaultValue: 'annecreations',
  },
};

/**
 * Validate environment variables
 */
export const validateEnvironmentVariables = (): void => {
  console.log('🔍 Validating environment variables...');

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];

    if (config.required && !value) {
      missing.push(`${key} - ${config.description}`);
    } else if (!value && config.defaultValue) {
      process.env[key] = config.defaultValue;
      console.log(`ℹ️  Using default value for ${key}: ${config.defaultValue}`);
    } else if (!value && !config.required) {
      warnings.push(`${key} - ${config.description}`);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\n💡 Please create a .env file with the required variables.');
    console.error('   You can copy .env.example and update the values.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    warnings.forEach(envVar => console.warn(`   - ${envVar}`));
  }

  console.log('✅ Environment variables validated successfully');
};

/**
 * Get environment variable with fallback
 */
export const getEnvVar = (key: string, fallback?: string): string => {
  return process.env[key] || fallback || '';
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};
