import { z } from 'zod'

export const eventcreateschema = z.object({
  name: z.string().min(3, 'min 3 chars'),
  description: z.string().optional(),
  type: z.enum(['Normal', 'Merchandise']),
  eligibility: z.enum(['all', 'iiit', 'external']),
  registrationLimit: z.number().positive().optional().or(z.literal(undefined)),
  fee: z.number().min(0).optional().or(z.literal(undefined)),
  tags: z.string().optional(),
})

export type eventcreateform = z.infer<typeof eventcreateschema>

export const eventpatchschema = z.object({
  description: z.string().min(10).optional(),
  deadline: z.string().optional(),
  registrationLimit: z.coerce.number().min(1).optional(),
})

export type eventpatchform = z.infer<typeof eventpatchschema>
