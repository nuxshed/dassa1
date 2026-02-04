import { z } from 'zod';

export const createresetschema = z.object({
  reason: z.string().optional()
});

export const resolveresetschema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional()
});
