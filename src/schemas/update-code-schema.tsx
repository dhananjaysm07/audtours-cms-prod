import { z } from 'zod';

export const updateCodeSchema = z.object({
  expiryDays: z.number().min(0, 'Days must be 0 or more'),
  expiryHours: z
    .number()
    .min(0, 'Hours must be 0 or more')
    .max(23, 'Hours must be less than 24'),
});

export type UpdateCodeSchema = z.infer<typeof updateCodeSchema>;
