import { z } from 'zod';

export const eventcreateschema = z.object({
  name: z.string().min(3, 'Minimum 3 characters'),
  description: z.string().optional(),
  eligibility: z.enum(['all', 'iiit', 'external']),
  registrationLimit: z.coerce.number().positive().optional().or(z.literal('')),
  tags: z.string().optional(),
  // Type-specific fields
  type: z.enum(['Normal', 'Merchandise']),
  fee: z.coerce.number().min(0).optional().or(z.literal('')),
  
  // Merchandise specific
  variants: z.array(z.object({
    name: z.string().min(1, "Variant name required"),
    stock: z.coerce.number().min(0, "Stock must be non-negative"),
    price: z.coerce.number().min(0).default(0)
  })).optional(),
  purchaseLimit: z.coerce.number().min(1).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.type === 'Merchandise') {
    if (!data.variants || data.variants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one variant is required for merchandise",
        path: ["variants"]
      });
    }
  }
});

export type eventcreateform = z.infer<typeof eventcreateschema>;

export const eventpatchschema = z.object({
  description: z.string().min(10).optional(),
  deadline: z.string().optional(),
  registrationLimit: z.coerce.number().min(1).optional(),
});

export type eventpatchform = z.infer<typeof eventpatchschema>;
