import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Anonymous Chat Platform API',
            version: '1.0.0',
            description: 'API documentation for the Anonymous Chat Platform',
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3001',
                description: 'Development server',
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
        },
    },
    apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
