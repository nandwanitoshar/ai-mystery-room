import mongoose from 'mongoose';

const SuspectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    bio: { type: String, required: true },
    alibi: { type: String, required: true },
    potentialMotive: { type: String, required: true },
  },
  { _id: false }
);

const ClueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['physical', 'testimonial', 'forensic', 'digital'],
      required: true,
    },
    locationFound: { type: String, required: true, trim: true },
    relatedSuspectId: { type: String, default: null },
  },
  { _id: false }
);

const HintSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    order: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const SolutionSchema = new mongoose.Schema(
  {
    culpritId: { type: String, required: true },
    culpritName: { type: String, required: true, trim: true },
    motive: { type: String, required: true },
    method: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const ScoreBreakdownSchema = new mongoose.Schema(
  {
    bonus: { type: Number, default: 0 },
    cluesBonus: { type: Number, default: 0 },
    hintsPenalty: { type: Number, default: 0 },
  },
  { _id: false }
);

const CaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    premise: { type: String, required: true, trim: true },
    crimeSceneSummary: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'solved', 'failed'],
      default: 'in_progress',
      index: true,
    },
    suspects: [SuspectSchema],
    clues: [ClueSchema],
    hints: [HintSchema],
    solution: { type: SolutionSchema, required: true },
    discoveredClueIds: {
      type: [String],
      default: [],
    },
    revealedHintIds: {
      type: [String],
      default: [],
    },
    accusedSuspectId: {
      type: String,
      default: null,
    },
    accusationRationale: {
      type: String,
      default: null,
    },
    isCorrectAccusation: {
      type: Boolean,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      type: ScoreBreakdownSchema,
      default: () => ({ bonus: 0, cluesBonus: 0, hintsPenalty: 0 }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias allowing 'story' to reference 'crimeSceneSummary'
CaseSchema.virtual('story')
  .get(function () {
    return this.crimeSceneSummary;
  })
  .set(function (val) {
    this.crimeSceneSummary = val;
  });

/**
 * Sanitizes case document for public client delivery.
 * Strips secret solution, culprit identity, and unrevealed clues/hints
 * whenever the investigation is in progress.
 */
CaseSchema.methods.toClientJSON = function () {
  const obj = this.toObject();

  if (obj.status === 'in_progress') {
    // Conceal private solution data
    delete obj.solution;
    delete obj.accusedSuspectId;
    delete obj.accusationRationale;
    delete obj.isCorrectAccusation;
    delete obj.score;
    delete obj.scoreBreakdown;

    // Sanitize clues: hide description and suspect linkage for undiscovered clues
    obj.clues = (obj.clues || []).map((clue) => {
      const isDiscovered = (obj.discoveredClueIds || []).includes(clue.id);
      if (!isDiscovered) {
        return {
          id: clue.id,
          title: clue.title,
          type: clue.type,
          locationFound: clue.locationFound,
          isDiscovered: false,
        };
      }
      return {
        ...clue,
        isDiscovered: true,
      };
    });

    // Expose only hints that the player has unlocked
    obj.revealedHints = (obj.hints || [])
      .filter((hint) => (obj.revealedHintIds || []).includes(hint.id))
      .sort((a, b) => a.order - b.order);
    delete obj.hints;
  } else {
    // For completed cases (solved / failed), expose solution and full debrief
    obj.clues = (obj.clues || []).map((clue) => ({
      ...clue,
      isDiscovered: (obj.discoveredClueIds || []).includes(clue.id),
    }));
    obj.revealedHints = obj.hints;
  }

  // Maximum hints allowance by difficulty
  const maxHintsMap = { easy: 2, medium: 3, hard: 3 };
  obj.maxHints = maxHintsMap[obj.difficulty] || 2;

  return obj;
};

const Case = mongoose.models.Case || mongoose.model('Case', CaseSchema);

export default Case;

