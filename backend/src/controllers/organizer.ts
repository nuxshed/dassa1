import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Organizer, Participant } from '../models/user'
import { z } from 'zod';

export const listpublic = async (req: Request, res: Response) => {
  try {
    const orgs = await Organizer.find().select('-password');
    res.json(orgs);
  } catch (e) {
    res.status(500).json({ message: 'server error' });
  }
};

export const getpublic = async (req: Request, res: Response) => {
  try {
    const org = await Organizer.findById(req.params.orgid).select('-password');

    if (!org) {
      return res.status(404).json({ message: 'not found' });
    }

    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const togglefollow = async (req: Request, res: Response) => {
  try {
    const participant = await Participant.findById(req.user?._id);

    if (!participant) {
      return res.status(404).json({ message: 'participant not found' });
    }

    const orgid = req.params.orgid;
    const idx = participant.following.indexOf(orgid as any);

    if (idx > -1) {
      participant.following.splice(idx, 1);
    } else {
      participant.following.push(orgid as any);
    }

    await participant.save();
    res.json({ following: participant.following });

  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const getownprofile = async (req: Request, res: Response) => {
  try {
    const org = await Organizer.findById(req.user?._id).select('-password');
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

const updateschema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  contact: z.string().min(10).optional(),
});


export const updateownprofile = async (req: Request, res: Response) => {
  try {
    const result = updateschema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const org = await Organizer.findByIdAndUpdate(
      req.user?._id,
      { $set: result.data },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
