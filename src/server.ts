import './config/env';
import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/db';
import { seedAll } from './config/seedData';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import requestRoutes from './routes/requestRoutes';
import responseRoutes from './routes/responseRoutes';
import abuseRoutes from './routes/abuseRoutes';
import adminRoutes from './routes/adminRoutes';
import abuseReportRoutes from './routes/abuseReportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// CORS - MUST BE FIRST!
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://community-support-service-exchange.vercel.app' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Community Support Platform Backend API',
    status: 'running'
  });
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
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedAll();
    

  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();