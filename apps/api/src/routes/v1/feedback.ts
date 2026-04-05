import { Router, Request, Response } from 'express';
import { prisma } from '@org/db';
import { getAuth } from '@clerk/express';
import { ok, fail } from '../../lib/respond.js';

const router = Router();

// POST /api/v1/feedback — content error report (auth optional)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { itemType, itemId, feedbackType, body } = req.body as {
    itemType: string;
    itemId: string;
    feedbackType: string;
    body: string;
  };

  if (!itemType || !itemId || !feedbackType || !body) {
    fail(res, 'BAD_REQUEST', 'itemType, itemId, feedbackType, and body are required', 400);
    return;
  }

  const validItemTypes = ['exercise', 'translation', 'word'];
  const validFeedbackTypes = ['error', 'confusing', 'suggestion'];

  if (!validItemTypes.includes(itemType) || !validFeedbackTypes.includes(feedbackType)) {
    fail(res, 'BAD_REQUEST', 'Invalid itemType or feedbackType', 400);
    return;
  }

  const userId = getAuth(req).userId ?? null;

  const feedback = await prisma.contentFeedback.create({
    data: { userId, itemType, itemId, feedbackType, body: String(body).slice(0, 2000) },
  });

  ok(res, { id: feedback.id }, 201);
});

export default router;
