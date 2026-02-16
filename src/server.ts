import './config/env';
import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
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
import messageRoutes from './routes/messageRoutes';
import Message from './models/Message';
import User from './models/User';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://community-support-service-exchange.vercel.app'
    ],
    credentials: true,
  },
});
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/admin', adminRoutes);
app.use('/api', abuseReportRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO
const userSockets = new Map<string, Set<string>>();
const onlineUsers = new Set<string>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', async (userId: string) => {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)?.add(socket.id);
    onlineUsers.add(userId);
    
    // Update user online status
    await User.findOneAndUpdate({ id: userId } as any, { isOnline: true, lastSeen: new Date() });
    
    // Broadcast online status
    io.emit('userStatusChange', { userId, isOnline: true });
    
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('sendMessage', async (data: { receiverId: string; senderId: string; content: string }) => {
    try {
      const conversationId = [data.senderId, data.receiverId].sort().join('_');
      const message = new Message({
        conversationId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
      });
      await message.save();

      const receiverSockets = userSockets.get(data.receiverId);
      if (receiverSockets) {
        receiverSockets.forEach(socketId => {
          io.to(socketId).emit('receiveMessage', message);
        });
      }
      socket.emit('messageSent', message);
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', (data: { receiverId: string; senderId: string }) => {
    const receiverSockets = userSockets.get(data.receiverId);
    if (receiverSockets) {
      receiverSockets.forEach(socketId => {
        io.to(socketId).emit('userTyping', { senderId: data.senderId });
      });
    }
  });

  socket.on('disconnect', async () => {
    for (const [userId, sockets] of userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          onlineUsers.delete(userId);
          
          // Update user offline status
          await User.findOneAndUpdate({ id: userId } as any, { isOnline: false, lastSeen: new Date() });
          
          // Broadcast offline status
          io.emit('userStatusChange', { userId, isOnline: false, lastSeen: new Date() });
        }
        console.log(`User ${userId} disconnected socket ${socket.id}`);
        break;
      }
    }
  });
});
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
    

  server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();