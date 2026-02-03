import { z } from 'zod';

const iiitemail = /^[a-zA-Z0-9._%+-]+@((research|students)\.)?iiit\.ac\.in$/;

export const loginschema = z.object({
  email: z.email('invalid email'),
  password: z.string().min(1, 'password required'),
});

export const signupschema = z.object({
  firstName: z.string().min(1, 'first name required'),
  lastName: z.string().min(1, 'last name required'),
  email: z.email('invalid email'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  contact: z.string().min(10, 'contact must be at least 10 digits'),
  college: z.string().min(1, 'college/organization is required'),
});

export type loginform = z.infer<typeof loginschema>;
export type signupform = z.infer<typeof signupschema>;
