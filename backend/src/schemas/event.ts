import { z } from 'zod';

const EventBase = z.object({
  name: z.string().min(1),
  description: z.string(),
  eligibility: z.string(), // FIXME: switch to something else once you understand
  dates: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    deadline: z.coerce.date(),
  }),
  limit: z.number().int().positive(),
  tags: z.array(z.string()),
});

export const CreateNormalEventSchema = EventBase.extend({
  type: z.literal("Normal"),
  fee: z.number().min(0),
  formSchema: z.json().optional(),
});

export const CreateMerchEventSchema = EventBase.extend({
  type: z.literal("Merchandise"),
  variants: z.array(z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number().int().min(0),
  })),
  purchaseLimit: z.number().int().default(1),
});

export const CreateEventSchema = z.discriminatedUnion("type", [
  CreateNormalEventSchema, 
  CreateMerchEventSchema
]);
