import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    
    info: {
      title: 'Community Support Platform API',
      version: '1.0.0',
      description: 'API documentation for the Community Support Platform backend: authentication, categories, requests, responses, and abuse reporting.',
      contact: {
        name: 'Community Support Platform',
        url: 'https://github.com/Tonzichantal7/community_support_flatform_backend',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: '',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'vendor', 'customer'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        
        ModerationAction: {
          type: 'object',
          properties: {
            adminId: { type: 'string' },
            action: { type: 'string', enum: ['REMOVE', 'RESTORE', 'DISMISS', 'WARN', 'NO_ACTION'] },
            reason: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        AbuseReport: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reporterId: { type: 'string' },
            targetType: { type: 'string', enum: ['REQUEST', 'RESPONSE', 'USER', 'OTHER'] },
            targetId: { type: 'string' },
            reason: { type: 'string' },
            details: { type: 'string' },
            status: { type: 'string', enum: ['OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED'] },
            isActive: { type: 'boolean' },
            actions: { type: 'array', items: { $ref: '#/components/schemas/ModerationAction' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
