import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/db';
import { seedAll } from './config/seedData';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import requestRoutes from './routes/requestRoutes';
import responseRoutes from './routes/responseRoutes';

// Load environment variables from project root .env (use cwd to be robust)
const _envPath = path.resolve(process.cwd(), '.env');
const _dotenvResult = dotenv.config({ path: _envPath });
console.log(`[dotenv] loaded ${Object.keys(_dotenvResult.parsed || {}).length} vars from ${_envPath}`);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Community Support Platform Backend API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/responses', responseRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Seed database with admin user
    await seedAll();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
