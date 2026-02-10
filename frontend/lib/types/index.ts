import { z } from 'zod'

export const role = z.enum(['Participant', 'Organizer', 'Admin'])
export const eventstatus = z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
export const eventtype = z.enum(['Normal', 'Merchandise'])
export const regstatus = z.enum(['Registered', 'Pending', 'Confirmed', 'Cancelled'])
export const eligibility = z.enum(['all', 'iiit', 'external'])

export type role = z.infer<typeof role>
export type eventstatus = z.infer<typeof eventstatus>
export type eventtype = z.infer<typeof eventtype>
export type regstatus = z.infer<typeof regstatus>
export type eligibility = z.infer<typeof eligibility>

export const userschema = z.object({
  _id: z.string(),
  email: z.email(),
  role: role,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  contact: z.string().optional(),
  college: z.string().optional(),
  type: z.enum(['IIIT', 'External']).optional(),
  interests: z.array(z.string()).optional(),
  following: z.array(z.string()).optional(),
})

export type user = z.infer<typeof userschema>

export const organizerschema = z.object({
  _id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  email: z.email(),
  followers: z.number().optional(),
})

export type organizer = z.infer<typeof organizerschema>

export const eventschema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  type: eventtype,
  status: eventstatus,
  organizer: z.union([z.string(), organizerschema]),
  eligibility: eligibility,
  dates: z.object({
    deadline: z.string(),
    start: z.string(),
    end: z.string(),
  }),
  registrationLimit: z.number().optional(),
  registrationCount: z.number().optional(),
  fee: z.number().optional(),
  tags: z.array(z.string()).optional(),

  item: z.object({
    sizes: z.array(z.string()),
    colors: z.array(z.string()),
    stock: z.number(),
    limit: z.number(),
  }).optional(),
})

export type event = z.infer<typeof eventschema>

export const registrationschema = z.object({
  _id: z.string(),
  ticketid: z.string(),
  event: z.union([z.string(), eventschema]),
  participant: z.union([z.string(), userschema]),
  status: regstatus,
  formdata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string(),
})

export type registration = z.infer<typeof registrationschema>
