import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { requireMembership } from '../middleware/scope';
import { asyncHandler } from '../utils/errors';
import { Flashcard } from '../models/Flashcard';

const router = Router();
router.use(requireAuth);

// GET /api/flashcards?businessId=xxx&category=xxx
router.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId, category, mine } = req.query as { businessId: string; category: string; mine: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const filter: Record<string, unknown> = { businessId };
  if (category) filter.category = category;
  if (mine === 'true') filter.createdBy = req.userId;
  else filter.$or = [{ isPublic: true }, { createdBy: req.userId }];

  const cards = await Flashcard.find(filter).populate('createdBy', 'name').lean();
  res.json({ flashcards: cards });
}));

// GET /api/flashcards/categories?businessId=xxx
router.get('/categories', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.query as { businessId: string };
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const cats = await Flashcard.distinct('category', { businessId });
  res.json({ categories: cats });
}));

// POST /api/flashcards
router.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });
  await requireMembership(req.userId!, businessId);

  const card = await Flashcard.create({ ...req.body, createdBy: req.userId });
  res.status(201).json({ flashcard: card });
}));

// PATCH /api/flashcards/:id
router.patch('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const card = await Flashcard.findOne({ _id: req.params.id, createdBy: req.userId });
  if (!card) return res.status(404).json({ error: 'Not found or not yours' });
  Object.assign(card, req.body);
  await card.save();
  res.json({ flashcard: card });
}));

// POST /api/flashcards/:id/review
router.post('/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  const { correct, businessId } = req.body;
  const card = await Flashcard.findOne({ _id: req.params.id, businessId });
  if (!card) return res.status(404).json({ error: 'Not found' });

  card.reviewCount += 1;
  if (correct) card.correctCount += 1;
  card.lastReviewedAt = new Date();

  const accuracy = card.correctCount / card.reviewCount;
  const days = accuracy > 0.8 ? 14 : accuracy > 0.6 ? 7 : accuracy > 0.4 ? 3 : 1;
  const next = new Date();
  next.setDate(next.getDate() + days);
  card.nextReviewDate = next.toISOString().split('T')[0];

  await card.save();
  res.json({ flashcard: card });
}));

// DELETE /api/flashcards/:id
router.delete('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  await Flashcard.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
  res.json({ ok: true });
}));

export default router;
