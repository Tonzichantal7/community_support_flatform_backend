import './config/env';
import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/db';
import { seedAll } from './config/seedData';
import { swaggerSpec } from './config/swagger';
import { verifyEmailConnection } from './config/email';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import requestRoutes from './routes/requestRoutes';
import responseRoutes from './routes/responseRoutes';
import abuseRoutes from './routes/abuseRoutes';
import adminRoutes from './routes/adminRoutes';
import abuseReportRoutes from './routes/abuseReportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { checkBanStatus } from './middleware/checkBanStatus';


// env already loaded by import './config/env'

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

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
app.use('/api/abuse', abuseRoutes);
app.use('/api', adminRoutes);
app.use('/api', abuseReportRoutes);
app.use('/api', analyticsRoutes);

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
    
    // Verify email connection (non-blocking)
    // Disabled to prevent startup issues
    // verifyEmailConnection().catch(err => {
    //   console.error('Email verification failed, but server will continue:', err.message);
    // });
    
    // app.listen(PORT, () => {
    //   console.log(`Server is running on port ${PORT}`);
    //   console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    // });
  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
