import express from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Ayushman Digital Hospital REST API Docs',
    version: '1.0.0',
    description: 'API documentation for the Ayushman Digital Hospital monorepo platform. Compliant with ABDM standards.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate User / Patient',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          400: { description: 'Invalid credentials' }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Server health status check',
        responses: {
          200: { description: 'Healthy' }
        }
      }
    },
    '/patients': {
      get: {
        summary: 'Retrieve all patients profiles',
        responses: {
          200: { description: 'Successful' }
        }
      }
    },
    '/queue': {
      get: {
        summary: 'Get active queue list',
        responses: {
          200: { description: 'Successful' }
        }
      }
    }
  }
};

const router = express.Router();

// Mount swagger-ui-express
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
export { swaggerDocument };
