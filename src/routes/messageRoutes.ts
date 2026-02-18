import express from 'express';
import { sendMessage, getMessages, getConversations, markAsRead } from '../controller/messageController';
import { getAllUsers } from '../controller/adminController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/send', authenticate, sendMessage);
router.get('/conversations', authenticate, getConversations);
router.get('/users', authenticate, getAllUsers);
router.get('/:userId', authenticate, getMessages);
router.put('/read/:userId', authenticate, markAsRead);

export default router;
