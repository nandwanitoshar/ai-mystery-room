import { Router } from 'express';
import {
  createCase,
  getCaseById,
  discoverClue,
  requestHint,
  submitAccusation,
  getCaseResult,
} from '../controllers/caseController.js';

const router = Router();

// POST /api/cases - Synthesize and persist a new mystery case
router.post('/', createCase);

// GET /api/cases/:id - Retrieve public case details and progress
router.get('/:id', getCaseById);

// POST /api/cases/:id/clues/:clueId/discover - Discover a clue
router.post('/:id/clues/:clueId/discover', discoverClue);

// POST /api/cases/:id/hints - Request the next available progressive hint
router.post('/:id/hints', requestHint);

// POST /api/cases/:id/accuse - Submit suspect accusation and seal case
router.post('/:id/accuse', submitAccusation);

// GET /api/cases/:id/result - Retrieve final score and solution for a closed case
router.get('/:id/result', getCaseResult);

export default router;
