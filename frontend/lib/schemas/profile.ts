import { z } from 'zod';

export const profileschema = z.object({
  firstName: z.string().min(1, 'required'),
  lastName: z.string().min(1, 'required'),
  contact: z.string().min(10, 'min 10 digits'),
  college: z.string().min(1, 'required'),
  interests: z.array(z.string()).optional(),
});

export type profileform = z.infer<typeof profileschema>

export const passwordschema = z.object({
  current: z.string().min(1, 'required'),
  password: z.string().min(8, 'min 8 chars'),
  confirm: z.string().min(8, 'min 8 chars'),
}).refine(d => d.password === d.confirm, {
  message: 'passwords must match',
  path: ['confirm'],
})

export type passwordform = z.infer<typeof passwordschema>
