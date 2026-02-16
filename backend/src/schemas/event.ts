import { z } from 'zod';

const basevent = z.object({
  name: z.string().min(1),
  description: z.string(),
  eligibility: z.string(), // FIXME: switch to something else once you understand
  dates: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    deadline: z.coerce.date(),
  }).refine(d => d.deadline <= d.start, {
    message: 'deadline must be before start'
  }).refine(d => d.start < d.end, {
    message: 'start must be before end'
  }),
  limit: z.number().int().positive(),
  tags: z.array(z.string()),
});

export const createnormaleventschema = basevent.extend({
  type: z.literal("Normal"),
  fee: z.number().min(0),
  formschema: z.any().optional(),
});

export const createmercheventschema = basevent.extend({
  type: z.literal("Merchandise"),
  variants: z.array(z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number().int().min(0),
  })),
  purchaselimit: z.number().int().min(1).default(1),
});

export const createventschema = z.discriminatedUnion("type", [
  createnormaleventschema, 
  createmercheventschema
]);

export const updateventschema = z.object({
  description: z.string().min(10).optional(),
  dates: z.object({
    deadline: z.coerce.date().optional()
  }).optional(),
  limit: z.number().int().min(1).optional(),
  fee: z.number().min(0).optional(),
  status: z.enum(['published', 'ongoing', 'completed', 'cancelled']).optional(),
  variants: z.array(z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number().int().min(0),
  })).optional()
}).strict();

export const formschema = z.object({
  fields: z.array(z.object({
    label: z.string().min(1),
    type: z.enum(['text', 'email', 'number', 'select', 'file', 'textarea']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional()
  })).min(1)
});

export const registerschema = z.object({
  formdata: z.array(z.any()).optional()
});
