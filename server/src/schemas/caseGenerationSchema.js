import { z } from 'zod';

export const suspectSchema = z.object({
  id: z.string().regex(/^suspect-[1-5]$/, 'Suspect ID must follow format suspect-N'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  role: z.string().trim().min(2, 'Role must be at least 2 characters').max(100),
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(500),
  alibi: z.string().trim().min(10, 'Alibi must be at least 10 characters').max(500),
  potentialMotive: z.string().trim().min(5, 'Potential motive must be provided').max(500),
});

export const clueSchema = z.object({
  id: z.string().regex(/^clue-[1-9]$/, 'Clue ID must follow format clue-N'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(600),
  type: z.enum(['physical', 'testimonial', 'forensic', 'digital'], {
    errorMap: () => ({ message: 'Clue type must be physical, testimonial, forensic, or digital.' }),
  }),
  locationFound: z.string().trim().min(2).max(120),
  relatedSuspectId: z.string().regex(/^suspect-[1-5]$/).nullable().optional().default(null),
});

export const hintSchema = z.object({
  id: z.string().regex(/^hint-[1-3]$/, 'Hint ID must follow format hint-N'),
  order: z.number().int().min(1).max(3),
  text: z.string().trim().min(10, 'Hint text must be at least 10 characters').max(400),
});

export const solutionSchema = z.object({
  culpritId: z.string().regex(/^suspect-[1-5]$/, 'Culprit ID must follow format suspect-N'),
  culpritName: z.string().trim().min(2).max(100),
  motive: z.string().trim().min(10).max(600),
  method: z.string().trim().min(10).max(600),
  explanation: z.string().trim().min(20, 'Explanation must be comprehensive').max(2500),
});

export const caseGenerationSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    premise: z.string().trim().min(10, 'Premise must be at least 10 characters').max(1000),
    crimeSceneSummary: z.string().trim().min(20, 'Crime scene summary must be at least 20 characters').max(1200),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    suspects: z.array(suspectSchema),
    clues: z.array(clueSchema),
    hints: z.array(hintSchema),
    solution: solutionSchema,
  })
  .superRefine((data, ctx) => {
    const rules = {
      easy: { suspects: 3, clues: 5, hints: 2 },
      medium: { suspects: 4, clues: 7, hints: 3 },
      hard: { suspects: 5, clues: 9, hints: 3 },
    }[data.difficulty];

    if (!rules) return;

    // 1. Verify exact counts
    if (data.suspects.length !== rules.suspects) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.difficulty} difficulty requires exactly ${rules.suspects} suspects; received ${data.suspects.length}.`,
        path: ['suspects'],
      });
    }

    if (data.clues.length !== rules.clues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.difficulty} difficulty requires exactly ${rules.clues} clues; received ${data.clues.length}.`,
        path: ['clues'],
      });
    }

    if (data.hints.length !== rules.hints) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.difficulty} difficulty requires exactly ${rules.hints} hints; received ${data.hints.length}.`,
        path: ['hints'],
      });
    }

    // 2. Verify unique IDs
    const suspectIds = new Set(data.suspects.map((s) => s.id));
    if (suspectIds.size !== data.suspects.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Suspect IDs must be unique.',
        path: ['suspects'],
      });
    }

    const clueIds = new Set(data.clues.map((c) => c.id));
    if (clueIds.size !== data.clues.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Clue IDs must be unique.',
        path: ['clues'],
      });
    }

    const hintIds = new Set(data.hints.map((h) => h.id));
    if (hintIds.size !== data.hints.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hint IDs must be unique.',
        path: ['hints'],
      });
    }

    // 3. Verify culprit is one of the generated suspects
    if (!suspectIds.has(data.solution.culpritId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `solution.culpritId (${data.solution.culpritId}) must match one of the generated suspect IDs.`,
        path: ['solution', 'culpritId'],
      });
    }
  });

