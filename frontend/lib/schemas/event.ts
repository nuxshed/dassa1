import { z } from 'zod'

export const eventcreateschema = z.object({
  name: z.string().min(3, 'min 3 chars'),
  description: z.string().min(10, 'describe your event'),
  type: z.enum(['Normal', 'Merchandise']),
  eligibility: z.enum(['all', 'iiit', 'external']),
  deadline: z.string().min(1, 'required'),
  start: z.string().min(1, 'required'),
  end: z.string().min(1, 'required'),
  registrationLimit: z.coerce.number().min(1).optional(),
  fee: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
})

export type eventcreateform = z.infer<typeof eventcreateschema>

export const eventpatchschema = z.object({
  description: z.string().min(10).optional(),
  deadline: z.string().optional(),
  registrationLimit: z.coerce.number().min(1).optional(),
})

export type eventpatchform = z.infer<typeof eventpatchschema>
