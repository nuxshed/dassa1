import { z } from 'zod';

export const RegisterNormalEventSchema = z.object({
  type: z.literal('Normal'),
  eventId: z.string().min(1),
});

export const RegisterMerchEventSchema = z.object({
  type: z.literal('Merchandise'),
  eventId: z.string().min(1),
  items: z.array(z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
});

export const RegistrationSchema = z.discriminatedUnion('type', [
  RegisterNormalEventSchema,
  RegisterMerchEventSchema,
]);

export const uploadproofschema = z.object({
  proofUrl: z.url()
});

export const updatepaymentstatusschema = z.object({
  status: z.enum(['Purchased', 'Rejected'])
});
