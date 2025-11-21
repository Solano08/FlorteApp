import { Router } from 'express';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import chatRoutes from './chatRoutes';
import groupRoutes from './groupRoutes';
import projectRoutes from './projectRoutes';
import libraryRoutes from './libraryRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';
import feedRoutes from './feedRoutes';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/chats', chatRoutes);
router.use('/groups', groupRoutes);
router.use('/projects', projectRoutes);
router.use('/library', libraryRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/feed', feedRoutes);
