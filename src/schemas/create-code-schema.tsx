import { z } from 'zod';

export const createCodeSchema = z
  .object({
    nodeIds: z.array(z.number()).min(1, 'Select at least one node'),
    validFrom: z.string(),
    validTo: z.string(),
    maxUsers: z.number().min(1, 'Must be at least 1'),
  })
  .refine(
    (data) => {
      const startTime = new Date(data.validFrom);
      const currentTime = new Date();
      const minStartTime = new Date(currentTime.getTime() + 5 * 60000); // Current time + 5 minutes

      return startTime >= minStartTime;
    },
    {
      message: 'Start time must be at least 5 minutes from now',
      path: ['validFrom'],
    }
  )
  .refine(
    (data) => {
      const startTime = new Date(data.validFrom);
      const endTime = new Date(data.validTo);

      return endTime > startTime;
    },
    {
      message: 'Expiry time must be after start time',
      path: ['validTo'],
    }
  );
export type CreateCodeSchema = z.infer<typeof createCodeSchema>;
