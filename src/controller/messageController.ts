import { Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import { AuthRequest } from '../types';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user?.id;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (messageType === 'text' && !content) {
      return res.status(400).json({ error: 'Content is required for text messages' });
    }

    if (messageType === 'image' && !req.file) {
      return res.status(400).json({ error: 'Image file is required for image messages' });
    }

    const receiver = await User.findOne({ id: receiverId } as Record<string, any>);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const conversationId = [senderId, receiverId].sort().join('_');

    const messageData: any = {
      conversationId,
      senderId,
      receiverId,
      messageType,
    };

    if (messageType === 'text') {
      messageData.content = content;
    } else if (messageType === 'image' && req.file) {
      messageData.imageUrl = `uploads/${req.file.filename}`;
      messageData.content = 'Image';
    }

    const message = new Message(messageData);
    await message.save();

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const conversationId = [currentUserId, userId].sort().join('_');

    const messages = await Message.find({ conversationId } as Record<string, any>)
      .sort({ createdAt: 1 })
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    } as Record<string, any>)
      .sort({ createdAt: -1 })
      .lean();

    const conversationMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        const user = await User.findOne({ id: otherUserId } as Record<string, any>)
          .select('id name email profilePicture isOnline lastSeen')
          .lean();
        
        if (user) {
          conversationMap.set(otherUserId, {
            user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, isOnline: user.isOnline, lastSeen: user.lastSeen },
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
          });
        }
      }
    }

    const unreadMessages = await Message.find({
      receiverId: userId,
      isRead: false,
    } as Record<string, any>).lean();

    unreadMessages.forEach((msg) => {
      const conv = conversationMap.get(msg.senderId);
      if (conv) {
        conv.unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, isRead: false } as any,
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};
