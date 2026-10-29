import mongoose from 'mongoose';
import Case from '../models/Case.js';
import { createCaseRequestSchema } from '../schemas/caseRequestSchemas.js';
import { generateMysteryCase, GeminiConfigError, GeminiGenerationError } from '../services/geminiService.js';

/**
 * POST /api/cases
 * Synthesizes a new AI mystery case and saves it to MongoDB.
 * Returns the public case view with solution fields sealed.
 */
export async function createCase(req, res) {
  try {
    // 1. Validate request body
    const parseResult = createCaseRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorDetails = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errorDetails}`,
        errors: parseResult.error.issues,
      });
    }

    const { premise, difficulty } = parseResult.data;

    // 2. Synthesize mystery through Gemini with procedural fallback
    const { caseData, source, modelUsed } = await generateMysteryCase({ premise, difficulty });

    // 3. Persist to MongoDB
    const newCase = new Case({
      title: caseData.title,
      premise: caseData.premise,
      crimeSceneSummary: caseData.crimeSceneSummary,
      difficulty: caseData.difficulty,
      status: 'in_progress',
      suspects: caseData.suspects,
      clues: caseData.clues,
      hints: caseData.hints,
      solution: caseData.solution,
      discoveredClueIds: [],
      revealedHintIds: [],
    });

    await newCase.save();

    // 4. Return sanitized client view
    const clientPayload = newCase.toClientJSON();
    clientPayload.meta = { source, modelUsed };

    return res.status(201).json({
      success: true,
      message: 'Mystery case synthesized and sealed in evidence locker.',
      data: clientPayload,
    });
  } catch (error) {
    if (error instanceof GeminiConfigError) {
      return res.status(error.statusCode || 503).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof GeminiGenerationError) {
      return res.status(error.statusCode || 502).json({
        success: false,
        message: error.message,
      });
    }

    console.error('[Case Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to synthesize mystery case. Please try again.',
    });
  }
}

/**
 * GET /api/cases/:id
 * Retrieves public case information and player investigation progress.
 * Strips secret solution fields while case is in progress.
 */
export async function getCaseById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID format.' });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    return res.status(200).json({
      success: true,
      data: caseDoc.toClientJSON(),
    });
  } catch (error) {
    console.error('[Get Case Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve case file.' });
  }
}

/**
 * POST /api/cases/:id/clues/:clueId/discover
 * Marks a clue as discovered. Idempotent: awards +5 points without duplicate inflation.
 */
export async function discoverClue(req, res) {
  try {
    const { id, clueId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID format.' });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (caseDoc.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This case has already been closed. Clues cannot be examined.',
      });
    }

    const clue = caseDoc.clues.find((c) => c.id === clueId);
    if (!clue) {
      return res.status(404).json({ success: false, message: 'Clue not found in this investigation.' });
    }

    // Idempotent discovery tracking
    if (!caseDoc.discoveredClueIds.includes(clueId)) {
      caseDoc.discoveredClueIds.push(clueId);
      await caseDoc.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Clue examined and cataloged into evidence.',
      data: {
        discoveredClue: {
          id: clue.id,
          title: clue.title,
          description: clue.description,
          type: clue.type,
          locationFound: clue.locationFound,
          relatedSuspectId: clue.relatedSuspectId,
          isDiscovered: true,
        },
        discoveredClueIds: caseDoc.discoveredClueIds,
        totalDiscovered: caseDoc.discoveredClueIds.length,
      },
    });
  } catch (error) {
    console.error('[Discover Clue Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to discover clue.' });
  }
}

/**
 * POST /api/cases/:id/hints
 * Unlocks the next progressive hint for the case. Deducts 10 points at final scoring.
 */
export async function requestHint(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID format.' });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (caseDoc.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'This case has already been closed.' });
    }

    const maxHintsMap = { easy: 2, medium: 3, hard: 3 };
    const maxHints = maxHintsMap[caseDoc.difficulty] || 2;

    if (caseDoc.revealedHintIds.length >= maxHints) {
      return res.status(400).json({
        success: false,
        message: 'Maximum hints reached for this difficulty level.',
      });
    }

    const sortedHints = [...caseDoc.hints].sort((a, b) => a.order - b.order);
    const nextHint = sortedHints.find((h) => !caseDoc.revealedHintIds.includes(h.id));

    if (!nextHint) {
      return res.status(400).json({ success: false, message: 'No further hints available.' });
    }

    caseDoc.revealedHintIds.push(nextHint.id);
    await caseDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Hint revealed by the senior investigator.',
      data: {
        newHint: {
          id: nextHint.id,
          order: nextHint.order,
          text: nextHint.text,
        },
        revealedHints: caseDoc.hints
          .filter((h) => caseDoc.revealedHintIds.includes(h.id))
          .sort((a, b) => a.order - b.order),
        hintsUsedCount: caseDoc.revealedHintIds.length,
        maxHints,
      },
    });
  } catch (error) {
    console.error('[Request Hint Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to request hint.' });
  }
}

/**
 * POST /api/cases/:id/accuse
 * Submits the player's prime suspect accusation. Seals the case, calculates score, and reveals solution.
 */
export async function submitAccusation(req, res) {
  try {
    const { id } = req.params;
    const { suspectId, rationale } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID format.' });
    }

    if (!suspectId || typeof suspectId !== 'string' || !suspectId.trim()) {
      return res.status(400).json({ success: false, message: 'A valid suspectId is required for an accusation.' });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (caseDoc.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This case has already been closed. Re-accusation is prohibited.',
      });
    }

    const targetSuspect = caseDoc.suspects.find((s) => s.id === suspectId.trim());
    if (!targetSuspect) {
      return res.status(400).json({
        success: false,
        message: 'The accused suspect does not exist in this investigation.',
      });
    }

    // Evaluate accuracy
    const isCorrect = caseDoc.solution.culpritId === targetSuspect.id;

    // Calculate score
    const bonusMap = { easy: 100, medium: 150, hard: 200 };
    const bonus = isCorrect ? bonusMap[caseDoc.difficulty] || 100 : 0;
    const cluesBonus = caseDoc.discoveredClueIds.length * 5;
    const hintsPenalty = caseDoc.revealedHintIds.length * 10;
    const totalScore = Math.max(0, bonus + cluesBonus - hintsPenalty);

    caseDoc.status = isCorrect ? 'solved' : 'failed';
    caseDoc.accusedSuspectId = targetSuspect.id;
    caseDoc.accusationRationale = rationale ? String(rationale).trim().slice(0, 1000) : null;
    caseDoc.isCorrectAccusation = isCorrect;
    caseDoc.score = totalScore;
    caseDoc.scoreBreakdown = {
      bonus,
      cluesBonus,
      hintsPenalty,
    };

    await caseDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Verdict rendered and case file sealed.',
      data: {
        verdict: {
          isCorrect,
          status: caseDoc.status,
          accusedSuspectId: targetSuspect.id,
        },
        score: {
          total: totalScore,
          breakdown: {
            bonus,
            cluesBonus,
            hintsPenalty,
          },
        },
        solution: caseDoc.solution,
      },
    });
  } catch (error) {
    console.error('[Accusation Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to process accusation.' });
  }
}

/**
 * GET /api/cases/:id/result
 * Retrieves the final result and debrief for a sealed case. Rejects if still in progress.
 */
export async function getCaseResult(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID format.' });
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (caseDoc.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Case investigation is still in progress. The final results are sealed until an accusation is rendered.',
      });
    }

    const accusedSuspect = caseDoc.suspects.find((s) => s.id === caseDoc.accusedSuspectId) || null;

    return res.status(200).json({
      success: true,
      data: {
        caseId: caseDoc._id,
        title: caseDoc.title,
        difficulty: caseDoc.difficulty,
        status: caseDoc.status,
        isCorrect: caseDoc.isCorrectAccusation,
        accusedSuspect,
        score: {
          total: caseDoc.score,
          breakdown: caseDoc.scoreBreakdown,
        },
        solution: caseDoc.solution,
        playerRationale: caseDoc.accusationRationale,
        closedAt: caseDoc.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Get Result Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve case results.' });
  }
}

export default {
  createCase,
  getCaseById,
  discoverClue,
  requestHint,
  submitAccusation,
  getCaseResult,
};
