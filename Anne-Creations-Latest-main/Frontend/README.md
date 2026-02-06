# Anne Creations - E-Commerce Web Application

A modern, full-featured e-commerce web application built with Next.js 15, React 19, and Material-UI. This is the end-user facing frontend application for Anne Creations, an embroidery designs and multi-needle embroidery machines e-commerce platform.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Key Components](#key-components)
- [Authentication Flow](#authentication-flow)
- [Routing Structure](#routing-structure)
- [Development Guidelines](#development-guidelines)
- [Build & Deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Anne Creations** is a comprehensive e-commerce platform specializing in:
- Exclusive embroidery designs
- Multi-needle embroidery machines
- Digital design downloads
- Product browsing and purchasing

This frontend application provides a seamless shopping experience with features including user authentication, product catalog, shopping cart, wishlist, checkout process, order management, and customer profile management.

---

## 🛠 Tech Stack

### Core Framework
- **Next.js 15.5.2** - React framework with App Router
- **React 19.0.0** - UI library
- **Node.js** - Runtime environment

### UI & Styling
- **Material-UI (MUI) 7.1.0** - Component library
- **Tailwind CSS 4.1.6** - Utility-first CSS framework
- **Emotion** - CSS-in-JS styling solution
- **React Icons** - Icon library

### State Management
- **Zustand 5.0.5** - Lightweight state management
- **Zustand Persist** - Persistent state storage

### HTTP Client
- **Axios 1.11.0** - HTTP client for API requests

### Additional Libraries
- **JWT Decode** - JWT token decoding
- **Crypto-JS** - Cryptographic functions
- **React OTP Input** - OTP verification component
- **React Responsive Carousel** - Image carousel
- **Keen Slider** - Touch slider
- **Notistack** - Snackbar notifications
- **React Tabs** - Tab component

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **dotenv-cli** - Environment variable management

---

## 📁 Project Structure

```
Annecreation-webapp/
├── public/                          # Static assets
│   ├── assets/                      # Images, logos, banners
│   │   ├── Banner_images/           # Homepage banners
│   │   ├── helppage_images/         # Help page assets
│   │   └── logo.svg                 # Application logo
│   ├── manifest.json                # PWA manifest
│   └── whatsapp.png                 # WhatsApp icon
│
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── About/                   # About page
│   │   ├── Arrival/                 # New arrivals section
│   │   ├── Auth/                    # Authentication pages
│   │   │   ├── Login/               # Login page & form
│   │   │   ├── Register/            # Registration page & form
│   │   │   ├── OTP/                 # OTP verification
│   │   │   └── forgotpassword/      # Password recovery
│   │   ├── Cart/                    # Shopping cart page
│   │   ├── Category/                # Category listing page
│   │   ├── Checkout/                # Checkout process
│   │   ├── Contactus/               # Contact page
│   │   ├── DeliveryInfo/            # Delivery information
│   │   ├── design/                  # Design catalog page
│   │   ├── Help/                    # Help & support page
│   │   ├── product/                 # Product detail pages
│   │   │   └── [productModel]/      # Dynamic product route
│   │   ├── Profile/                 # User profile & account
│   │   │   ├── OrderHistory.jsx     # Order history
│   │   │   ├── Orderdetails.jsx     # Order details
│   │   │   ├── Downloads.jsx        # Digital downloads
│   │   │   ├── MyProfile.jsx        # Profile management
│   │   │   ├── ChangePassword.jsx   # Password change
│   │   │   └── AccountsTab.jsx      # Account settings
│   │   ├── WishList/                # Wishlist page
│   │   ├── reset-password/          # Password reset
│   │   ├── verify-email/            # Email verification
│   │   ├── privacypolicy/           # Privacy policy
│   │   ├── terms_conditions/        # Terms & conditions
│   │   ├── return/                  # Return policy
│   │   ├── layout.js                # Root layout
│   │   ├── page.js                  # Homepage
│   │   └── globals.css              # Global styles
│   │
│   ├── components/                  # Reusable components
│   │   ├── Banner/                  # Homepage banner
│   │   ├── Billing/                 # Billing address components
│   │   ├── BreadCrum/               # Breadcrumb navigation
│   │   ├── Cards/                   # Product cards
│   │   ├── categoryCard/            # Category cards
│   │   ├── DiscountModal/           # Discount modal
│   │   ├── Footer.jsx               # Site footer
│   │   ├── Header/                  # Site header & navigation
│   │   │   ├── Header.jsx           # Main header component
│   │   │   ├── Header_links.jsx     # Navigation links
│   │   │   ├── DesktopNav.jsx       # Desktop navigation
│   │   │   ├── MobileDrawer.jsx     # Mobile menu drawer
│   │   │   ├── SearchBar.jsx        # Product search
│   │   │   ├── Logo.jsx             # Logo component
│   │   │   └── ProfileMenu.jsx      # User profile menu
│   │   ├── ProductCard/             # Product card components
│   │   ├── WishListCard/            # Wishlist card
│   │   ├── LoadingScreen.jsx        # Loading component
│   │   ├── ScrollTotop.jsx          # Scroll to top button
│   │   └── whatsapp_icon.jsx        # WhatsApp floating button
│   │
│   ├── Store/                       # Zustand state stores
│   │   ├── authStore.js             # Authentication state
│   │   ├── cartStore.js             # Shopping cart state
│   │   ├── categoryStore.js         # Category state
│   │   ├── checkoutStore.js         # Checkout state
│   │   ├── productStore.js          # Product state
│   │   ├── wishlistStore.js         # Wishlist state
│   │   ├── addressStore.js          # Address management
│   │   ├── contactStore.js          # Contact form state
│   │   ├── PaymentStore.js          # Payment state
│   │   ├── SearchStore.js           # Search state
│   │   └── DownloadStore.js         # Downloads state
│   │
│   ├── hook/                        # Custom React hooks
│   │   ├── useCategory.js           # Category hook
│   │   ├── useWishlist.js           # Wishlist hook
│   │   ├── useOrder.js              # Order hook
│   │   └── ProfileData.js           # Profile data hook
│   │
│   ├── lib/                         # Utility libraries
│   │   ├── axiosClient.js           # Axios instance & interceptors
│   │   ├── helpers.js               # Helper functions
│   │   └── signatureUtils.js        # HMAC signature utilities
│   │
│   └── Provider/                    # Context providers
│       ├── AnalyticsProvider.jsx    # Analytics initialization
│       └── NotiStackProvider.jsx    # Notification provider
│
├── complete_opencart_api_documentation.html  # API documentation
├── complete_opencart_api_routes.md          # API routes reference
├── opencart_postman_collection_complete.json # Postman collection
├── product_api_docs.html                    # Product API docs
│
├── next.config.mjs                  # Next.js configuration
├── jsconfig.json                    # JavaScript path aliases
├── postcss.config.mjs               # PostCSS configuration
├── eslint.config.mjs                # ESLint configuration
├── package.json                     # Dependencies & scripts
└── README.md                        # This file
```

---

## ✨ Features

### 🔐 Authentication & User Management
- **User Registration** - Email and mobile-based registration with OTP verification
- **Login/Logout** - Secure JWT-based authentication
- **Password Management** - Forgot password, reset password functionality
- **Email Verification** - Email verification flow
- **Profile Management** - Update profile, change password
- **Session Management** - Automatic token refresh, persistent sessions

### 🛍 Shopping Features
- **Product Catalog** - Browse products by category, search products
- **Product Details** - Detailed product pages with images, descriptions, options
- **Shopping Cart** - Add/remove items, quantity management, cart persistence
- **Wishlist** - Save favorite products for later
- **Category Browsing** - Browse products by categories
- **New Arrivals** - Latest products section
- **Design Catalog** - Specialized design browsing with filters

### 💳 Checkout & Orders
- **Checkout Process** - Multi-step checkout with billing information
- **Coupon System** - Apply discount coupons (manual and auto-apply)
- **Order Management** - View order history, order details
- **Order Status** - Track order status
- **Payment Integration** - Payment processing (via API)

### 📦 Account Features
- **Order History** - View all past orders
- **Order Details** - Detailed order information
- **Digital Downloads** - Download purchased digital products
- **Address Management** - Manage shipping addresses
- **Account Settings** - Update account information

### 🎨 UI/UX Features
- **Responsive Design** - Mobile-first, fully responsive
- **Loading States** - Skeleton loaders, loading indicators
- **Error Handling** - User-friendly error messages
- **Notifications** - Toast notifications for actions
- **Image Optimization** - Next.js Image optimization
- **Scroll to Top** - Smooth scroll to top button
- **WhatsApp Integration** - Direct WhatsApp contact button

### 📱 Additional Features
- **Help & Support** - Help page with language options
- **Contact Us** - Contact form
- **About Page** - Company information
- **Legal Pages** - Privacy policy, terms & conditions, return policy
- **Analytics** - User analytics tracking
- **SEO Optimized** - Meta tags, structured data

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **Git** (for version control)
- **Backend API** - The application requires a running backend API server

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Annecreation-webapp
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables) section for details):

```bash
cp .env.example .env.local  # If you have an example file
# or create .env.local manually
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

---

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
# For production: https://api.annecreationshb.com

# OTP Security
NEXT_PUBLIC_OTP_SECRET_KEY=your-otp-secret-key-here

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Environment Variable Descriptions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_OTP_SECRET_KEY` | Secret key for OTP signature generation | Yes | - |
| `NEXT_PUBLIC_ANALYTICS_ID` | Analytics tracking ID | No | - |

**Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser. Never include sensitive secrets in these variables.

---

## 🔌 API Integration

### API Client Configuration

The application uses a centralized Axios client (`src/lib/axiosClient.js`) with the following features:

- **Base URL Configuration** - Configured via `NEXT_PUBLIC_API_URL`
- **Request Interceptors** - Automatically attaches JWT access tokens
- **Response Interceptors** - Handles token refresh on 401/403 errors
- **Token Refresh** - Automatic token refresh with request queuing
- **Error Handling** - Centralized error handling
- **Credentials** - Supports cookie-based authentication

### API Endpoints

The application integrates with the following API endpoints:

#### Authentication
- `POST /api/customers/login` - User login
- `POST /api/customers/register` - User registration
- `POST /api/customers/send-otp` - Send OTP for verification
- `POST /api/customers/refresh-token` - Refresh access token
- `POST /api/customers/logout` - User logout
- `POST /api/customers/forgot-password` - Request password reset
- `POST /api/customers/reset-password` - Reset password
- `GET /api/customers/profile` - Get user profile
- `PUT /api/customers/profile` - Update user profile
- `POST /api/customers/change-password` - Change password

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/:productModel` - Get product by model
- `GET /api/products/:productModel/related` - Get related products

#### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/remove/:itemId` - Remove item from cart
- `POST /api/cart/clear` - Clear cart

#### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist/add` - Add to wishlist
- `DELETE /api/wishlist/remove/:productId` - Remove from wishlist

#### Checkout
- `POST /api/checkout/start` - Start checkout process
- `GET /api/checkout/:orderId/status` - Get checkout status
- `DELETE /api/checkout/:orderId/cancel` - Cancel checkout
- `POST /api/checkout/payment/create` - Create payment

#### Coupons
- `POST /api/coupons/apply-coupon` - Apply coupon code
- `GET /api/coupons/auto-apply/:orderId` - Auto-apply available coupon

#### Categories
- `GET /api/categories` - Get all categories

#### Analytics
- `GET /api/analytics/start` - Initialize analytics session

### API Documentation

For complete API documentation, refer to:
- `complete_opencart_api_documentation.html`
- `complete_opencart_api_routes.md`
- `opencart_postman_collection_complete.json`

---

## 🗄 State Management

The application uses **Zustand** for state management with persistence. Each store manages specific domain state:

### Auth Store (`authStore.js`)
- User information
- Authentication tokens (access & refresh)
- Authentication status
- Login, register, logout functions
- Profile management
- Password management
- OTP verification

**Persisted Data:** `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `isAdminSession`, `adminContext`, `MobileOTP`, `otpVerified`

### Cart Store (`cartStore.js`)
- Cart items
- Cart count
- Subtotal
- Add/remove/clear cart functions

**Persisted Data:** `cart`, `cartCount`, `subtotal`

### Product Store (`productStore.js`)
- Products list
- Product details
- Related products
- Loading states

**Not Persisted** - Fetched on demand

### Wishlist Store (`wishlistStore.js`)
- Wishlist items
- Wishlist count
- Add/remove functions

**Persisted Data:** `wishlist`, `wishlistCount`

### Checkout Store (`checkoutStore.js`)
- Order ID
- Checkout status
- Coupon information
- Payment data

**Persisted Data:** All checkout-related state

### Category Store (`categoryStore.js`)
- Categories list
- Loading states

**Not Persisted** - Fetched on demand

### Other Stores
- `addressStore.js` - Shipping addresses
- `contactStore.js` - Contact form state
- `PaymentStore.js` - Payment processing
- `SearchStore.js` - Search functionality
- `DownloadStore.js` - Digital downloads

---

## 🧩 Key Components

### Header Component
**Location:** `src/components/Header/Header.jsx`

Main navigation component featuring:
- Top bar with contact info and social links
- Sticky navigation bar
- Logo
- Search bar
- User menu (when authenticated)
- Cart icon with count
- Wishlist icon with count
- Mobile responsive drawer

### Product Card
**Location:** `src/components/ProductCard/ProductCard.jsx`

Reusable product card component with:
- Product image with zoom/view functionality
- Product title and price
- Add to cart button
- Add to wishlist button
- Quick view options

### Cart Components
**Location:** `src/app/Cart/`

- `CartPage.jsx` - Main cart page
- `CartTable.jsx` - Cart items table
- `CartItemRow.jsx` - Individual cart item row
- `Pricedetails.jsx` - Price summary and checkout button
- `CartAction.jsx` - Cart action buttons

### Checkout Components
**Location:** `src/app/Checkout/`

- `Checoukoutpage.jsx` - Main checkout page
- `OrderSummary.jsx` - Order summary sidebar
- `CheckoutStatus.jsx` - Checkout status display
- `BillingForm.jsx` - Billing information form
- `BillingModal.jsx` - Address selection modal

### Authentication Components
**Location:** `src/app/Auth/`

- `LoginForm.jsx` - Login form
- `RegisterForm.jsx` - Registration form
- `OtpInput.jsx` - OTP verification input
- `EmailVerification.jsx` - Email verification component

### Profile Components
**Location:** `src/app/Profile/`

- `ProfilePage.jsx` - Main profile page with tabs
- `MyProfile.jsx` - Profile information
- `OrderHistory.jsx` - Order history list
- `Orderdetails.jsx` - Order detail view
- `Downloads.jsx` - Digital downloads
- `ChangePassword.jsx` - Password change form
- `AccountsTab.jsx` - Account settings

---

## 🔐 Authentication Flow

### Registration Flow

1. User fills registration form (`RegisterForm.jsx`)
2. User enters mobile number
3. System sends OTP via `sendOtp()` API call
4. User enters OTP in `OtpInput.jsx`
5. OTP is verified and stored in `authStore`
6. Registration API call includes OTP
7. On success, user is logged in automatically
8. Tokens are stored in `authStore` (persisted)

### Login Flow

1. User enters email and password
2. `login()` function in `authStore` is called
3. API returns `accessToken` and `refreshToken`
4. Tokens stored in `authStore` (persisted)
5. User redirected to homepage or intended page

### Token Refresh Flow

1. API request fails with 401/403
2. `axiosClient` interceptor catches error
3. Refresh token API call is made
4. New access token received
5. Failed request is retried with new token
6. Other queued requests are processed

### Logout Flow

1. `logout()` function called
2. Logout API call made
3. All auth state cleared from store
4. User redirected to login page

---

## 🛣 Routing Structure

The application uses Next.js 15 App Router. All routes are defined in `src/app/`:

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `page.js` | Homepage with banner, categories, new arrivals |
| `/About` | `About/page.jsx` | About page |
| `/Auth/Login` | `Auth/Login/page.jsx` | Login page |
| `/Auth/Register` | `Auth/Register/page.jsx` | Registration page |
| `/Auth/OTP` | `Auth/OTP/page.jsx` | OTP verification |
| `/Auth/forgotpassword` | `Auth/forgotpassword/page.jsx` | Forgot password |
| `/product/[productModel]` | `product/[productModel]/page.jsx` | Product detail page |
| `/Category` | `Category/page.jsx` | Category listing |
| `/design` | `design/page.jsx` | Design catalog |
| `/Cart` | `Cart/page.jsx` | Shopping cart |
| `/Checkout` | `Checkout/page.jsx` | Checkout process |
| `/Profile` | `Profile/page.jsx` | User profile |
| `/WishList` | `WishList/page.jsx` | Wishlist |
| `/Contactus` | `Contactus/page.jsx` | Contact page |
| `/Help` | `Help/page.jsx` | Help & support |
| `/reset-password` | `reset-password/page.js` | Password reset |
| `/verify-email` | `verify-email/page.jsx` | Email verification |
| `/privacypolicy` | `privacypolicy/page.jsx` | Privacy policy |
| `/terms_conditions` | `terms_conditions/page.jsx` | Terms & conditions |
| `/return` | `return/page.jsx` | Return policy |
| `/DeliveryInfo` | `DeliveryInfo/page.jsx` | Delivery information |

---

## 💻 Development Guidelines

### Code Style

- Use **functional components** with hooks
- Follow **React best practices**
- Use **ESLint** for code quality
- Follow **Next.js conventions**

### File Naming

- Components: `PascalCase.jsx` (e.g., `ProductCard.jsx`)
- Pages: `page.jsx` or `page.js`
- Utilities: `camelCase.js` (e.g., `helpers.js`)
- Stores: `camelCase.js` (e.g., `authStore.js`)

### Path Aliases

The project uses path aliases configured in `jsconfig.json`:

```javascript
import Component from '@/components/Component'
import { useStore } from '@/Store/store'
import { helper } from '@/lib/helpers'
```

### State Management Best Practices

1. **Use Zustand stores** for global state
2. **Use local state** (useState) for component-specific state
3. **Persist important state** (auth, cart, wishlist)
4. **Keep stores focused** - one store per domain

### API Calls

1. **Always use `axiosClient`** from `@/lib/axiosClient`
2. **Handle errors** appropriately
3. **Show loading states** during API calls
4. **Update stores** after successful API calls

### Component Structure

```jsx
'use client'; // If using client-side features

import React from 'react';
import { useStore } from '@/Store/store';

const Component = () => {
  // Hooks
  const data = useStore((state) => state.data);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

---

## 🏗 Build & Deployment

### Development Build

```bash
npm run dev
```

Runs the development server with Turbopack at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

### Build Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run lint:check` | Check linting (no warnings) |

### Deployment Considerations

1. **Environment Variables** - Set all required environment variables
2. **API URL** - Update `NEXT_PUBLIC_API_URL` for production
3. **Image Domains** - Configure `next.config.mjs` for image domains
4. **Build Optimization** - Ensure build completes without errors
5. **Static Assets** - Verify all assets are included in build

### Next.js Configuration

Key configurations in `next.config.mjs`:

- **Image Domains:** Configured for `annecreationshb.com` and `annecreation.reesanit.com`
- **ESLint:** Ignored during builds (configure as needed)
- **React Strict Mode:** Disabled (can be enabled for development)

---

## 🔍 Troubleshooting

### Common Issues

#### 1. API Connection Errors

**Problem:** API calls failing with connection errors

**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Ensure backend API is running
- Check CORS configuration on backend
- Verify network connectivity

#### 2. Authentication Issues

**Problem:** User gets logged out frequently

**Solutions:**
- Check token expiration settings
- Verify refresh token flow
- Check localStorage/sessionStorage access
- Ensure cookies are enabled

#### 3. Build Errors

**Problem:** Build fails with errors

**Solutions:**
- Run `npm run lint:fix` to fix linting issues
- Clear `.next` folder and rebuild
- Check for missing dependencies
- Verify all environment variables are set

#### 4. Image Loading Issues

**Problem:** Images not loading

**Solutions:**
- Verify image domains in `next.config.mjs`
- Check image URLs are correct
- Ensure images exist in `public/assets/`
- Check Next.js Image component usage

#### 5. State Persistence Issues

**Problem:** State not persisting after refresh

**Solutions:**
- Check Zustand persist configuration
- Verify localStorage is accessible
- Check browser storage permissions
- Review store partialize configuration

### Debugging Tips

1. **Check Browser Console** - Look for errors and warnings
2. **Network Tab** - Monitor API requests and responses
3. **React DevTools** - Inspect component state and props
4. **Zustand DevTools** - Use Zustand DevTools extension
5. **Next.js Debug Mode** - Use `NODE_OPTIONS='--inspect' npm run dev`

---

## 📚 Additional Resources

### Documentation Files

- `complete_opencart_api_documentation.html` - Complete API documentation
- `complete_opencart_api_routes.md` - API routes reference
- `opencart_postman_collection_complete.json` - Postman collection
- `product_api_docs.html` - Product API documentation

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Axios Documentation](https://axios-http.com)

---

## 👥 Support & Contact

For support and inquiries:

- **Email:** support@annecreationshb.com
- **Phone:** +91 9951916767
- **Website:** [Anne Creations](https://annecreationshb.com)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🎉 Acknowledgments

Built with:
- Next.js team for the amazing framework
- React team for the UI library
- Material-UI team for the component library
- All open-source contributors whose packages are used in this project

---

**Last Updated:** 2024  
**Version:** 0.1.0  
**Maintained by:** Anne Creations Development Team
#   A n n e - C r e a t i o n s - L a t e s t  
 