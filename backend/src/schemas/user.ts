import { z } from 'zod';

const iiitemail = /^[a-zA-Z0-9._%+-]+@((research|students)\.)?iiit\.ac\.in$/;
// const e164 = '^\+[1-9]\d{1,14}$'
// TODO: switch to e164 latee maybe but have to manually coerce

export const ParticipantBase = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email({ pattern: iiitemail }),
  password: z.string().min(8),
  contact: z.string().min(10),
  college: z.string().min(1),
  type: z.enum(['IIIT', 'External']),
  // FIXME: switch to enums later maybe
  interests: z.array(z.string()).optional(),
});

export const CreateParticipantSchema = z.discriminatedUnion("type", [
  ParticipantBase.extend({
    type: z.literal('IIIT'),
    email: z.email().regex(iiitemail, { 
      message: "iiit students = iiit email" 
    }),
  }),
  ParticipantBase.extend({
    type: z.literal('External'),
    email: z.email(),
  }),
]);

export const CreateOrganizerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  contact: z.string().min(10),
  password: z.string().min(8).optional(),
  category: z.string().min(1),
  description: z.string().optional(),
});
