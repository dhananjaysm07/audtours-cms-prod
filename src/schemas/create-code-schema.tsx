import { z } from 'zod';

export const createCodeSchema = z.object({
  nodeIds: z.array(z.number()),
  validFrom: z.string(),
  validTo: z.string(),
  maxUsers: z.number().min(1, 'Maximum users must be at least 1'),
});

export type CreateCodeSchema = z.infer<typeof createCodeSchema>;
