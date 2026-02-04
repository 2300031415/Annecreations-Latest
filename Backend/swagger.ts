// swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';

// Define interface for Swagger spec
interface SwaggerSpec {
  [key: string]: unknown;
  paths?: {
    [path: string]: unknown;
  };
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AnneCreations Embroidery Design API',
      description:
        'Complete API for embroidery design selling platform with machine options, categories, cart, wishlist, and Razorpay integration',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@annecreations.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://annecreation.reesanit.com/'
            : 'http://localhost:5000/',
        description: 'Prod server',
      },
    ],
    components: {
      securitySchemes: {
        customerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Customer JWT token',
        },
        adminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin JWT token',
        },
      },
      schemas: {
        // Base schemas
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Error message' },
            error: { type: 'string', description: 'Error type' },
            statusCode: { type: 'number', description: 'HTTP status code' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Success message' },
            data: { type: 'object', description: 'Response data' },
          },
        },

        // Product schemas
        ProductOption: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Option ID' },
            option: { type: 'string', description: 'Machine option reference' },
            price: { type: 'number', description: 'Option price' },
            uploadedFilePath: { type: 'string', description: 'Uploaded file path' },
            fileSize: { type: 'number', description: 'File size in bytes' },
            mimeType: { type: 'string', description: 'File MIME type' },
            downloadCount: { type: 'number', description: 'Download count' },
            isPurchased: {
              type: 'boolean',
              description: 'Whether current customer has purchased this option',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Product ID' },
            productModel: { type: 'string', description: 'Product model name' },
            sku: { type: 'string', description: 'Product SKU' },
            description: { type: 'string', description: 'Product description' },
            stitches: { type: 'string', description: 'Number of stitches' },
            dimensions: { type: 'string', description: 'Product dimensions' },
            colourNeedles: { type: 'string', description: 'Color and needle information' },
            image: { type: 'string', description: 'Main product image with /image/ prefix' },
            additionalImages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  image: { type: 'string', description: 'Image path with /image/ prefix' },
                  sortOrder: { type: 'number', description: 'Sort order' },
                },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', description: 'Category ID' },
                  name: { type: 'string', description: 'Category name' },
                },
              },
            },
            options: { type: 'array', items: { $ref: '#/components/schemas/ProductOption' } },
            status: { type: 'boolean', description: 'Product status' },
            viewed: { type: 'number', description: 'Number of times viewed' },
            sortOrder: { type: 'number', description: 'Sort order for display' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string', description: 'SEO meta title' },
                metaDescription: { type: 'string', description: 'SEO meta description' },
                metaKeyword: { type: 'string', description: 'SEO meta keywords' },
              },
            },
            languageId: { type: 'string', description: 'Language ID reference' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            isPurchased: {
              type: 'boolean',
              description: 'Whether current customer has purchased this product',
            },
          },
        },

        // Category schemas
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Category ID' },
            name: { type: 'string', description: 'Category name' },
            description: { type: 'string', description: 'Category description' },
            image: { type: 'string', description: 'Category image path with /image/ prefix' },
            sortOrder: { type: 'number', description: 'Sort order for display' },
            status: { type: 'boolean', description: 'Category status' },
            productCount: { type: 'number', description: 'Number of products in this category' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string', description: 'SEO meta title' },
                metaDescription: { type: 'string', description: 'SEO meta description' },
                metaKeyword: { type: 'string', description: 'SEO meta keywords' },
              },
            },
            languageId: { type: 'string', description: 'Language ID reference' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Customer schemas
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Customer ID' },
            firstName: { type: 'string', description: 'First name' },
            lastName: { type: 'string', description: 'Last name' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            mobile: { type: 'string', description: 'Mobile number' },
            status: { type: 'boolean', description: 'Account status' },
            newsletter: { type: 'boolean', description: 'Newsletter subscription status' },
            emailVerified: { type: 'boolean', description: 'Email verification status' },
            mobileVerified: { type: 'boolean', description: 'Mobile verification status' },
            totalLogins: { type: 'number', description: 'Total number of logins' },
            lastLogin: { type: 'string', format: 'date-time', description: 'Last login timestamp' },
            addresses: {
              type: 'array',
              items: { $ref: '#/components/schemas/CustomerAddress' },
              description: 'Customer addresses',
            },
            language: { type: 'string', description: 'Language ID reference' },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        CustomerLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Customer email' },
            password: { type: 'string', description: 'Customer password' },
          },
        },
        CustomerCreate: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', description: 'First name' },
            lastName: { type: 'string', description: 'Last name' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            password: { type: 'string', description: 'Password' },
            mobile: { type: 'string', description: 'Mobile number' },
          },
        },
        CustomerAuthResponse: {
          type: 'object',
          properties: {
            customer: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Customer ID' },
                firstName: { type: 'string', description: 'First name' },
                lastName: { type: 'string', description: 'Last name' },
                email: { type: 'string', format: 'email', description: 'Email address' },
                mobile: { type: 'string', description: 'Mobile number' },
                status: { type: 'boolean', description: 'Account status' },
                newsletter: { type: 'boolean', description: 'Newsletter subscription' },
                totalLogins: { type: 'number', description: 'Total login count' },
                lastLogin: { type: 'string', format: 'date-time', description: 'Last login date' },
              },
            },
            accessToken: { type: 'string', description: 'JWT access token' },
            refreshToken: { type: 'string', description: 'JWT refresh token' },
          },
        },
        CustomerAddress: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Address ID' },
            firstName: { type: 'string', description: 'First name' },
            lastName: { type: 'string', description: 'Last name' },
            company: { type: 'string', description: 'Company name' },
            addressLine1: { type: 'string', description: 'Address line 1' },
            addressLine2: { type: 'string', description: 'Address line 2' },
            city: { type: 'string', description: 'City' },
            postcode: { type: 'string', description: 'Postal code' },
            country: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Country ID' },
                name: { type: 'string', description: 'Country name' },
              },
            },
            zone: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Zone ID' },
                name: { type: 'string', description: 'Zone name' },
              },
            },
            preferedBillingAddress: { type: 'boolean', description: 'Preferred billing address' },
          },
        },

        // Cart schemas
        CartItem: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Cart item ID' },
            product: { type: 'string', description: 'Product ID reference' },
            productDetails: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Product ID' },
                productModel: { type: 'string', description: 'Product model name' },
                sku: { type: 'string', description: 'Product SKU' },
                image: { type: 'string', description: 'Product image path with /image/ prefix' },
              },
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  option: { type: 'string', description: 'Product option ID' },
                  price: { type: 'number', description: 'Option price' },
                },
              },
            },
            subtotal: { type: 'number', description: 'Item subtotal' },
            addedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When item was added to cart',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Cart ID' },
            customerId: { type: 'string', description: 'Customer ID reference' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            itemCount: { type: 'number', description: 'Total number of items in cart' },
            subtotal: { type: 'number', description: 'Cart subtotal' },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Cart creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Wishlist schemas
        WishlistItem: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Wishlist item ID' },
            product: { $ref: '#/components/schemas/Product' },
            dateAdded: { type: 'string', format: 'date-time' },
          },
        },
        Wishlist: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Wishlist ID' },
            customer: { type: 'string', description: 'Customer ID' },
            items: { type: 'array', items: { $ref: '#/components/schemas/WishlistItem' } },
          },
        },

        // Order schemas
        OrderProduct: {
          type: 'object',
          properties: {
            product: {
              type: 'object',
              description: 'Product details (populated)',
              properties: {
                _id: { type: 'string', description: 'Product ID' },
                productModel: { type: 'string', description: 'Product model name' },
                sku: { type: 'string', description: 'Product SKU' },
                image: { type: 'string', description: 'Product image URL' },
                price: { type: 'number', description: 'Product price' },
                description: { type: 'string', description: 'Product description' },
              },
            },
            options: {
              type: 'array',
              description: 'Product options selected',
              items: {
                type: 'object',
                properties: {
                  option: { type: 'string', description: 'Product option ID' },
                  price: { type: 'number', description: 'Option price' },
                },
              },
            },
            subtotal: { type: 'number', description: 'Product subtotal' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Order ID' },
            customer: { type: 'string', description: 'Customer ID' },
            orderStatus: {
              type: 'string',
              enum: ['pending', 'processing', 'paid', 'cancelled', 'refunded', 'failed'],
              description: 'Current order status',
            },
            orderTotal: { type: 'number', description: 'Order total amount' },
            products: { type: 'array', items: { $ref: '#/components/schemas/OrderProduct' } },
            payment: {
              type: 'object',
              description: 'Payment information',
              properties: {
                firstName: { type: 'string', description: 'Payment first name' },
                lastName: { type: 'string', description: 'Payment last name' },
                company: { type: 'string', description: 'Payment company name' },
                address1: { type: 'string', description: 'Payment address line 1' },
                address2: { type: 'string', description: 'Payment address line 2' },
                city: { type: 'string', description: 'Payment city' },
                postcode: { type: 'string', description: 'Payment postal code' },
                country: { type: 'string', description: 'Payment country' },
                zone: { type: 'string', description: 'Payment zone/state' },
                addressFormat: { type: 'string', description: 'Address format used' },
                method: { type: 'string', description: 'Payment method used' },
                code: { type: 'string', description: 'Payment method code' },
              },
            },
            languageId: {
              type: 'object',
              description: 'Language information (populated)',
              properties: {
                _id: { type: 'string', description: 'Language ID' },
                name: { type: 'string', description: 'Language name' },
                code: { type: 'string', description: 'Language code' },
              },
            },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  orderStatus: { type: 'string', description: 'Status at this point' },
                  comment: { type: 'string', description: 'Status change comment' },
                  notify: { type: 'boolean', description: 'Whether customer was notified' },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Status change timestamp',
                  },
                },
              },
              description: 'Order status history',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Payment schemas
        RazorpayOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Razorpay order ID' },
            amount: { type: 'number', description: 'Amount in paise' },
            currency: { type: 'string', description: 'Currency code' },
            receipt: { type: 'string', description: 'Receipt ID' },
            status: { type: 'string', description: 'Order status' },
          },
        },
        PaymentVerification: {
          type: 'object',
          properties: {
            razorpayOrderId: { type: 'string', description: 'Razorpay order ID' },
            razorpayPaymentId: { type: 'string', description: 'Razorpay payment ID' },
            razorpaySignature: { type: 'string', description: 'Payment signature' },
          },
        },

        // Admin schemas
        Admin: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Admin ID' },
            username: { type: 'string', description: 'Admin username' },
            email: { type: 'string', format: 'email', description: 'Admin email' },
            role: { type: 'string', description: 'Admin role' },
            status: { type: 'boolean', description: 'Admin status' },
            dateAdded: { type: 'string', format: 'date-time' },
          },
        },
        AdminLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', description: 'Admin username' },
            password: { type: 'string', description: 'Admin password' },
          },
        },
        AdminLoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Success message' },
            admin: { $ref: '#/components/schemas/Admin' },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', description: 'JWT access token' },
                refreshToken: { type: 'string', description: 'JWT refresh token' },
              },
            },
          },
        },
        AdminProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Admin ID' },
            username: { type: 'string', description: 'Admin username' },
            name: { type: 'string', description: 'Full name' },
            email: { type: 'string', format: 'email', description: 'Admin email' },
            image: { type: 'string', description: 'Profile image' },
            status: { type: 'boolean', description: 'Admin status' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation date' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update date' },
          },
        },

        // Country and Zone schemas
        Country: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Country ID' },
            name: { type: 'string', description: 'Country name' },
            isoCode2: { type: 'string', description: 'ISO 2-letter code' },
            isoCode3: { type: 'string', description: 'ISO 3-letter code' },
            addressFormat: { type: 'string', description: 'Address format template' },
            postcodeRequired: {
              type: 'boolean',
              description: 'Whether postcode is required for addresses',
            },
            status: { type: 'boolean', description: 'Country status' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Zone: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Zone ID' },
            name: { type: 'string', description: 'Zone name' },
            code: { type: 'string', description: 'Zone code' },
            country: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Country ID' },
                name: { type: 'string', description: 'Country name' },
                isoCode2: { type: 'string', description: 'ISO 2-letter code' },
                isoCode3: { type: 'string', description: 'ISO 3-letter code' },
              },
              description: 'Country reference object',
            },
            status: { type: 'boolean', description: 'Zone status' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Coupon schemas
        Coupon: {
          type: 'object',
          required: ['name', 'code', 'type', 'discount'],
          properties: {
            _id: { type: 'string', description: 'Coupon ID' },
            name: {
              type: 'string',
              description: 'Coupon name',
              maxLength: 255,
              example: 'New Year Sale',
            },
            code: {
              type: 'string',
              description: 'Coupon code (uppercase, unique)',
              maxLength: 50,
              pattern: '^[A-Z0-9_-]+$',
              example: 'NEWYEAR2024',
            },
            type: {
              type: 'string',
              enum: ['F', 'P'],
              description: 'Coupon type (F=Fixed amount, P=Percentage)',
              example: 'P',
            },
            discount: {
              type: 'number',
              description: 'Discount value (0-100 for percentage, any positive for fixed)',
              minimum: 0,
              example: 20,
            },
            logged: {
              type: 'boolean',
              description: 'Whether coupon usage is logged',
              default: false,
            },
            minAmount: {
              type: 'number',
              description: 'Minimum order amount required to apply coupon',
              minimum: 0,
              default: 0,
              example: 100,
            },
            maxDiscount: {
              type: 'number',
              description: 'Maximum discount amount (for percentage coupons)',
              minimum: 0,
              default: 0,
              example: 500,
            },
            dateStart: {
              type: 'string',
              format: 'date-time',
              description: 'Valid from date',
              example: '2024-01-01T00:00:00Z',
            },
            dateEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Valid to date (optional)',
              example: '2024-01-31T23:59:59Z',
            },
            totalUses: {
              type: 'number',
              description: 'Total usage limit (0 = unlimited)',
              minimum: 0,
              default: 0,
              example: 500,
            },
            customerUses: {
              type: 'number',
              description: 'Usage limit per customer (0 = unlimited)',
              minimum: 0,
              default: 0,
              example: 2,
            },
            status: {
              type: 'boolean',
              description: 'Coupon status (active/inactive)',
              default: true,
            },
            autoApply: {
              type: 'boolean',
              description: 'Auto-apply coupon at checkout (only one can be true)',
              default: false,
            },
            languageId: { type: 'string', description: 'Language ID reference' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        CouponCreate: {
          type: 'object',
          required: ['name', 'code', 'type', 'discount'],
          properties: {
            name: {
              type: 'string',
              description: 'Coupon name',
              maxLength: 255,
              example: 'New Year Sale',
            },
            code: {
              type: 'string',
              description: 'Coupon code (will be converted to uppercase)',
              maxLength: 50,
              example: 'newyear2024',
            },
            type: {
              type: 'string',
              enum: ['F', 'P'],
              description: 'Coupon type (F=Fixed amount, P=Percentage)',
              example: 'P',
            },
            discount: {
              type: 'number',
              description: 'Discount value (0-100 for percentage, any positive for fixed)',
              minimum: 0.01,
              example: 20,
            },
            logged: {
              type: 'boolean',
              description: 'Whether coupon usage is logged',
              default: false,
            },
            minAmount: {
              type: 'number',
              description: 'Minimum order amount required to apply coupon',
              minimum: 0,
              default: 0,
              example: 100,
            },
            maxDiscount: {
              type: 'number',
              description: 'Maximum discount amount (for percentage coupons)',
              minimum: 0,
              default: 0,
              example: 500,
            },
            dateStart: {
              type: 'string',
              format: 'date-time',
              description: 'Valid from date',
              example: '2024-01-01T00:00:00Z',
            },
            dateEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Valid to date (optional)',
              example: '2024-01-31T23:59:59Z',
            },
            totalUses: {
              type: 'number',
              description: 'Total usage limit (0 = unlimited)',
              minimum: 0,
              default: 0,
              example: 500,
            },
            customerUses: {
              type: 'number',
              description: 'Usage limit per customer (0 = unlimited, cannot exceed totalUses)',
              minimum: 0,
              default: 0,
              example: 2,
            },
            status: {
              type: 'boolean',
              description: 'Coupon status (active/inactive)',
              default: true,
            },
            autoApply: {
              type: 'boolean',
              description: 'Auto-apply coupon at checkout (only one coupon can have this enabled at a time)',
              default: false,
            },
            languageId: { type: 'string', description: 'Language ID reference (optional)' },
          },
        },
        CouponUsage: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Usage record ID' },
            coupon: { type: 'string', description: 'Coupon ID reference' },
            customer: { type: 'string', description: 'Customer ID reference' },
            order: { type: 'string', description: 'Order ID reference' },
            discountAmount: {
              type: 'number',
              description: 'Actual discount amount applied',
              example: 25.5,
            },
            orderTotal: {
              type: 'number',
              description: 'Original order total before discount',
              example: 127.5,
            },
            usedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the coupon was used',
              example: '2024-01-15T14:30:00Z',
            },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Language schemas
        Language: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Language ID' },
            name: { type: 'string', description: 'Language name' },
            code: { type: 'string', description: 'Language code' },
            status: { type: 'boolean', description: 'Language status' },
          },
        },

        // Option schemas
        Option: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Option ID' },
            name: { type: 'string', description: 'Option name' },
            type: { type: 'string', description: 'Option type' },
            status: { type: 'boolean', description: 'Option status' },
          },
        },

        // Analytics schemas
        AnalyticsData: {
          type: 'object',
          properties: {
            totalProducts: { type: 'number', description: 'Total products count' },
            totalCustomers: { type: 'number', description: 'Total customers count' },
            totalOrders: { type: 'number', description: 'Total orders count' },
            totalRevenue: { type: 'number', description: 'Total revenue' },
            recentOrders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
            topProducts: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          },
        },
        OrderAnalytics: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'Analytics period' },
            summary: {
              type: 'object',
              properties: {
                totalOrders: { type: 'number', description: 'Total orders' },
                totalRevenue: { type: 'number', description: 'Total revenue' },
                averageOrderValue: { type: 'number', description: 'Average order value' },
                conversionRate: { type: 'number', description: 'Conversion rate' },
              },
            },
            ordersByStatus: {
              type: 'object',
              properties: {
                pending: { type: 'number', description: 'Pending orders' },
                processing: { type: 'number', description: 'Processing orders' },
                paid: { type: 'number', description: 'Paid orders' },
                cancelled: { type: 'number', description: 'Cancelled orders' },
              },
            },
            dailyOrders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date', description: 'Date' },
                  orders: { type: 'number', description: 'Number of orders' },
                  revenue: { type: 'number', description: 'Revenue' },
                },
              },
            },
          },
        },

        // Migration schemas
        MigrationStatus: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Migration ID' },
            phase: { type: 'string', description: 'Migration phase' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'failed'],
              description: 'Migration status',
            },
            startTime: { type: 'string', format: 'date-time', description: 'Start time' },
            endTime: { type: 'string', format: 'date-time', description: 'End time' },
            recordsProcessed: { type: 'number', description: 'Records processed' },
            errorLog: { type: 'string', description: 'Error log' },
          },
        },

        // Search Log schemas
        SearchLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Search log ID' },
            query: { type: 'string', description: 'Search query' },
            results: { type: 'number', description: 'Number of results' },
            userAgent: { type: 'string', description: 'User agent' },
            ipAddress: { type: 'string', description: 'IP address' },
            timestamp: { type: 'string', format: 'date-time', description: 'Search timestamp' },
          },
        },

        // User Activity schemas
        UserActivity: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Activity ID' },
            customer: { type: 'string', description: 'Customer ID (only for logged-in customers)' },
            action: { type: 'string', description: 'Action performed' },
            entityType: {
              type: 'string',
              enum: [
                'Product',
                'Order',
                'Customer',
                'Category',
                'Cart',
                'Wishlist',
                'Search',
                'Auth',
                'Other',
              ],
              description: 'Type of entity the activity relates to',
            },
            productId: { type: 'string', description: 'Product ID (if entityType is Product)' },
            orderId: { type: 'string', description: 'Order ID (if entityType is Order)' },
            categoryId: { type: 'string', description: 'Category ID (if entityType is Category)' },
            entityId: { type: 'string', description: 'Generic entity ID for other types' },
            activityData: { type: 'object', description: 'Additional activity data' },
            ipAddress: { type: 'string', description: 'IP address' },
            userAgent: { type: 'string', description: 'User agent' },
            browserId: { type: 'string', description: 'Browser ID for tracking' },
            source: { type: 'string', enum: ['web', 'mobile'], description: 'Client source' },
            lastActivity: {
              type: 'string',
              format: 'date-time',
              description: 'Last activity timestamp',
            },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' },
          },
        },

        // Audit Log schemas
        AuditLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Audit log ID' },
            user: { type: 'string', description: 'User ID' },
            userType: { type: 'string', enum: ['customer', 'admin'], description: 'User type' },
            username: { type: 'string', description: 'Username' },
            email: { type: 'string', description: 'Email address' },
            action: { type: 'string', description: 'Action performed' },
            entityType: {
              type: 'string',
              enum: [
                'Product',
                'Customer',
                'Order',
                'Admin',
                'Category',
                'Language',
                'Country',
                'Zone',
                'Wishlist',
                'Cart',
                'SearchLog',
                'UserActivity',
                'OnlineUser',
              ],
              description: 'Type of entity affected',
            },
            productId: { type: 'string', description: 'Product ID (if entityType is Product)' },
            orderId: { type: 'string', description: 'Order ID (if entityType is Order)' },
            customerId: { type: 'string', description: 'Customer ID (if entityType is Customer)' },
            categoryId: { type: 'string', description: 'Category ID (if entityType is Category)' },
            adminId: { type: 'string', description: 'Admin ID (if entityType is Admin)' },
            entityId: { type: 'string', description: 'Generic entity ID for other types' },
            previousState: { type: 'object', description: 'Previous state of the entity' },
            newState: { type: 'object', description: 'New state of the entity' },
            details: { type: 'string', description: 'Additional details' },
            ipAddress: { type: 'string', description: 'IP address' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Update timestamp' },
          },
        },

        // Online User schemas
        OnlineUser: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Online user ID' },
            userId: { type: 'string', description: 'User ID' },
            userType: { type: 'string', enum: ['customer', 'admin'], description: 'User type' },
            lastActivity: {
              type: 'string',
              format: 'date-time',
              description: 'Last activity time',
            },
            ipAddress: { type: 'string', description: 'IP address' },
            userAgent: { type: 'string', description: 'User agent' },
          },
        },

        // System schemas
        SystemHealth: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: 'System status',
            },
            timestamp: { type: 'string', format: 'date-time', description: 'Check timestamp' },
            uptime: { type: 'number', description: 'System uptime in seconds' },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Database connection status' },
                responseTime: { type: 'number', description: 'Database response time in ms' },
              },
            },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number', description: 'Used memory in bytes' },
                free: { type: 'number', description: 'Free memory in bytes' },
                total: { type: 'number', description: 'Total memory in bytes' },
              },
            },
          },
        },
        SystemMetrics: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time', description: 'Metrics timestamp' },
            uptime: { type: 'number', description: 'System uptime in seconds' },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number', description: 'Used memory in bytes' },
                free: { type: 'number', description: 'Free memory in bytes' },
                total: { type: 'number', description: 'Total memory in bytes' },
              },
            },
            cpu: {
              type: 'object',
              properties: {
                usage: { type: 'number', description: 'CPU usage percentage' },
              },
            },
            requests: {
              type: 'object',
              properties: {
                total: { type: 'number', description: 'Total requests' },
                perMinute: { type: 'number', description: 'Requests per minute' },
              },
            },
          },
        },
        SystemOverview: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time', description: 'Overview timestamp' },
            system: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'System status' },
                uptime: { type: 'number', description: 'System uptime in seconds' },
                version: { type: 'string', description: 'System version' },
              },
            },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Database status' },
                collections: { type: 'number', description: 'Number of collections' },
                documents: { type: 'number', description: 'Total documents' },
              },
            },
            statistics: {
              type: 'object',
              properties: {
                totalProducts: { type: 'number', description: 'Total products' },
                totalCustomers: { type: 'number', description: 'Total customers' },
                totalOrders: { type: 'number', description: 'Total orders' },
                totalRevenue: { type: 'number', description: 'Total revenue' },
              },
            },
          },
        },

        // Pagination schema
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Current page number' },
            limit: { type: 'number', description: 'Items per page' },
            total: { type: 'number', description: 'Total number of items' },
            pages: { type: 'number', description: 'Total number of pages' },
            hasNext: { type: 'boolean', description: 'Has next page' },
            hasPrev: { type: 'boolean', description: 'Has previous page' },
          },
        },

        // Additional schemas
        WishlistAdd: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', description: 'Product ID to add to wishlist' },
          },
        },
        OrderHistory: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Order ID' },
            orderNumber: { type: 'string', description: 'Order number' },
            status: { type: 'string', description: 'Order status' },
            total: { type: 'number', description: 'Order total' },
            dateAdded: { type: 'string', format: 'date-time', description: 'Order date' },
            products: { type: 'array', items: { $ref: '#/components/schemas/OrderProduct' } },
          },
        },
        OrderCreate: {
          type: 'object',
          required: ['products'],
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'options'],
                properties: {
                  productId: { type: 'string', description: 'Product ID' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Selected options',
                  },
                },
              },
            },
            comment: { type: 'string', description: 'Order comment' },
          },
        },
        OrderStatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', description: 'New order status' },
            comment: { type: 'string', description: 'Status change comment' },
          },
        },
        CartItemAdd: {
          type: 'object',
          required: ['productId', 'options'],
          properties: {
            productId: { type: 'string', description: 'Product ID' },
            options: { type: 'array', items: { type: 'string' }, description: 'Selected options' },
          },
        },
        CartItemUpdate: {
          type: 'object',
          properties: {
            options: { type: 'array', items: { type: 'string' }, description: 'Updated options' },
          },
        },
        DashboardSales: {
          type: 'object',
          properties: {
            current: {
              type: 'object',
              properties: {
                period: { type: 'string', description: 'Current period' },
                revenue: { type: 'number', description: 'Current period revenue' },
                orders: { type: 'number', description: 'Current period orders' },
                averageOrderValue: { type: 'number', description: 'Average order value' },
              },
            },
            previous: {
              type: 'object',
              properties: {
                period: { type: 'string', description: 'Previous period' },
                revenue: { type: 'number', description: 'Previous period revenue' },
                orders: { type: 'number', description: 'Previous period orders' },
                averageOrderValue: {
                  type: 'number',
                  description: 'Previous period average order value',
                },
              },
            },
            comparison: {
              type: 'object',
              properties: {
                revenueChange: { type: 'number', description: 'Revenue change percentage' },
                ordersChange: { type: 'number', description: 'Orders change percentage' },
                averageOrderValueChange: {
                  type: 'number',
                  description: 'Average order value change percentage',
                },
              },
            },
            chartData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date', description: 'Date' },
                  revenue: { type: 'number', description: 'Daily revenue' },
                  orders: { type: 'number', description: 'Daily orders' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.ts', './controllers/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options) as SwaggerSpec;

// Transform all paths to include /api prefix
const transformedSpec: SwaggerSpec = {
  ...swaggerSpec,
  paths: Object.keys(swaggerSpec.paths || {}).reduce(
    (acc: { [path: string]: unknown }, path: string) => {
      // Add /api prefix to all paths
      const newPath = path.startsWith('/api/') ? path : `/api${path}`;
      acc[newPath] = swaggerSpec.paths![path];
      return acc;
    },
    {}
  ),
};

export default transformedSpec;
