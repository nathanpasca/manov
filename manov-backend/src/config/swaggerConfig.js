// File: src/config/swaggerConfig.js

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Specify OpenAPI version
    info: {
      title: 'Manov API Documentation',
      version: '1.0.0',
      description:
        'API documentation for the Manov application, a platform for translated novels.',
      contact: {
        name: 'Manov Support',
        // url: 'your-website.com', // Optional
        // email: 'support@your-domain.com', // Optional
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}/api/v1`, // Adjust if your base path is different
        description: 'Development server',
      },
      // You can add more servers (e.g., staging, production) here
    ],
    // Define components like security schemes (e.g., for JWT) and reusable schemas
    components: {
      securitySchemes: {
        bearerAuth: { // Name of the security scheme
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Optional, for documentation
          description: 'Enter JWT Bearer token in the format: Bearer {token}'
        }
      },
      schemas: {
        // Example Reusable Schema for Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Error message details' },
            errors: { // For validation errors from express-validator
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {type: 'string', example: 'field'},
                        msg: {type: 'string', example: 'Invalid value'},
                        path: {type: 'string', example: 'fieldName'},
                        location: {type: 'string', example: 'body'}
                    }
                }
            }
          }
        },
        // Define other reusable schemas here (e.g., Language, Author, Novel, User)
        Language: {
            type: 'object',
            properties: {
                id: { type: 'integer', example: 1 },
                code: { type: 'string', example: 'en', description: '2-5 character language code' },
                name: { type: 'string', example: 'English' },
                nativeName: { type: 'string', example: 'English', nullable: true },
                isActive: { type: 'boolean', example: true }
            }
        },
        // ... more schemas
      }
    },
    // Define global security (optional, can also be applied per-operation)
    // security: [
    //   {
    //     bearerAuth: [] // Applies bearerAuth to all operations unless overridden
    //   }
    // ]
  },
  // Path to the API docs (JSDoc comments)
  // This should point to your route files
  apis: ['./src/routes/*.js'], // Glob pattern to find API route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;