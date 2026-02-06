# Anne Creations API

A RESTful API for Anne Creations e-commerce platform built with Node.js, Express, TypeScript, and MongoDB.

## Features

- 🛍️ Product catalog management
- 🛒 Shopping cart functionality
- 👥 Customer management
- 📦 Order processing
- 💳 Payment integration (Razorpay)
- 🔍 Search functionality
- 📊 Analytics and reporting
- 🔐 Authentication and authorization
- 📱 Admin dashboard
- 📖 API documentation (Swagger)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- MySQL (for legacy data migration)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anne_api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/anne_creations
JWT_SECRET=your_jwt_secret_key_here
```

### Optional Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Configuration (for migration)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=anne_creations

# Razorpay Configuration (optional - payment features will be disabled if not set)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Email Configuration (optional) - GoDaddy Workspace Email
EMAIL_HOST=smtp.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=your_email@yourdomain.com
EMAIL_FROM_NAME=Anne Creations

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Getting Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings > API Keys
3. Generate API Keys
4. Copy the Key ID and Key Secret to your `.env` file

**Note:** If you don't set Razorpay credentials, the application will start normally but payment features will be disabled.

## Email Configuration

The API uses email for notifications (order confirmations, password resets, etc.). Proper SSL/TLS configuration is crucial to avoid authentication errors.

### Configuration Options

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.secureserver.net` |
| `EMAIL_PORT` | SMTP server port | `465` (SSL) or `587` (TLS) |
| `EMAIL_SECURE` | Use SSL (true for port 465) | `true` for port 465, `false` for port 587 |
| `EMAIL_USER` | SMTP username/email | `your_email@yourdomain.com` |
| `EMAIL_PASSWORD` | SMTP password | Your email password |
| `EMAIL_FROM` | Sender email address | `your_email@yourdomain.com` |
| `EMAIL_FROM_NAME` | Sender name | `Anne Creations` |

### Recommended Configurations

#### GoDaddy Workspace Email (Recommended - Port 465 with SSL)
```env
EMAIL_HOST=smtp.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yourdomain.com
EMAIL_FROM=your_email@yourdomain.com
```

#### Alternative: Port 587 with TLS
```env
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_REQUIRE_TLS=true
```

### GoDaddy Workspace Email Setup

For GoDaddy Workspace Email (recommended configuration):

1. Use your **full email address** as `EMAIL_USER` (e.g., support@annecreations.com)
2. Use your **actual email password** (no app-specific password needed)
3. Set `EMAIL_FROM` to match `EMAIL_USER`
4. SMTP server: `smtp.secureserver.net`
5. Port: `465` with `EMAIL_SECURE=true`

### Gmail Setup

If using Gmail, you need to use an **App Password** instead of your regular password:

1. Enable 2-Factor Authentication on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this app password in `EMAIL_PASSWORD`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_REQUIRE_TLS=true
```

### Common Issues

**"535 Authentication rejected" error:**
- **GoDaddy:** Make sure you're using your full email address as `EMAIL_USER`
- **GoDaddy:** Verify `EMAIL_FROM` matches `EMAIL_USER`
- **Gmail:** Use an app password, not your regular password
- Verify SSL/TLS settings match your email provider's requirements

**"Must issue a STARTTLS command first":**
- Wrong secure/port combination
- For port 465: use `EMAIL_SECURE=true`
- For port 587: use `EMAIL_SECURE=false`

**App not crashing on email errors:**
- The API now gracefully handles email failures
- Email errors are logged but won't crash the application
- Users will still receive success responses even if emails fail to send

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:5000/api/docs`
- Health Check: `http://localhost:5000/api/health`
- Metrics: `http://localhost:5000/api/metrics`

## Database Migration

If you need to migrate data from an existing MySQL database:

```bash
# Check migration readiness
npm run migrate:check

# Run specific migration phases
npm run migrate:phase1
npm run migrate:phase2
# ... continue for other phases

# Or run all migrations
npm run migrate:all
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## Project Structure

```
anne_api/
├── app.ts                 # Main application file
├── config/               # Database configuration
├── controllers/          # Route controllers
├── middleware/           # Express middleware
├── models/              # Database models
├── routes/              # API routes
├── services/            # Business logic services
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── scripts/             # Migration and utility scripts
```

## Error Handling

The application includes comprehensive error handling:
- Graceful handling of missing environment variables
- Payment service availability checks
- Database connection error handling
- API rate limiting
- Security middleware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the ISC License.
