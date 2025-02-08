import { z } from 'zod';

export const createCodeSchema = z.object({
  nodeIds: z.array(z.number()).min(1, 'Select at least one node'),
  expiryDays: z.number().min(0, 'Days must be 0 or more'),
  expiryHours: z
    .number()
    .min(0, 'Hours must be 0 or more')
    .max(23, 'Hours must be less than 24'),
  maxUsers: z.number().min(1, 'Must be at least 1'),
});

export type CreateCodeSchema = z.infer<typeof createCodeSchema>;
