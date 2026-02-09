import { z } from 'zod'

export const orgcreateschema = z.object({
  name: z.string().min(2, 'required'),
  category: z.string().min(1, 'required'),
  description: z.string().min(10, 'describe the club'),
  email: z.email('invalid email'),
})

export type orgcreateform = z.infer<typeof orgcreateschema>
