import { z } from 'zod';

export const createCaseRequestSchema = z.object({
  premise: z
    .string({
      invalid_type_error: 'Premise must be a string.',
    })
    .trim()
    .min(5, 'Premise must be at least 5 characters long.')
    .max(300, 'Premise must not exceed 300 characters.')
    .optional()
    .or(z.literal('')),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be one of: easy, medium, hard.' }),
  }),
});

