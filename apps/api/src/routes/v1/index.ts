import { Router } from 'express';
import authRouter from './auth.js';
import curriculumRouter from './curriculum.js';
import corpusRouter from './corpus.js';
import usersRouter from './users.js';
import reviewsRouter from './reviews.js';
import audioRouter from './audio.js';
import feedbackRouter from './feedback.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/', curriculumRouter);       // /levels, /units/:id/lessons, /lessons/:id
router.use('/', corpusRouter);           // /words/:id, /roots/:id, /verses/:surah/:ayah
router.use('/users', usersRouter);       // /users/me/stats, etc.
router.use('/reviews', reviewsRouter);   // /reviews/queue, /reviews/submit
router.use('/audio', audioRouter);       // /audio/:reciter/:surah/:ayah
router.use('/feedback', feedbackRouter); // /feedback

export default router;
