import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Organizer, Participant } from '../models/user';
import { resetrequest } from '../models/resetrequest';
import { createresetschema } from '../schemas/resetreq';
import { z } from 'zod';

export const listpublic = async (req: Request, res: Response) => {
  try {
    const orgs = await Organizer.find().select('-password');
    const orgsWithFollowers = await Promise.all(orgs.map(async (org) => {
      const followers = await Participant.countDocuments({ following: org._id });
      return { ...org.toObject(), followers };
    }));
    res.json(orgsWithFollowers);
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
  contactEmail: z.string().email().optional(),
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

export const getresetstatus = async (req: Request, res: Response) => {
  try {
    const request = await resetrequest.findOne({ organizer: req.user?._id }).sort({ createdat: -1 });

    if (!request) {
      return res.json({
        status: 'none',
        message: 'no reset requests found',
      });
    }

    const response: any = {
      requestid: request._id,
      status: request.status,
      createdat: request.createdat,
      reason: request.reason
    };

    if (request.status === 'approved' || request.status === 'rejected') {
      response.resolvedat = request.resolvedat;
      if (request.note) {
        response.note = request.note;
      }
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const createresetrequest = async (req: Request, res: Response) => {
  try {
    const result = createresetschema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const existing = await resetrequest.findOne({
      organizer: req.user?._id,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({
        message: 'you already have a pending request',
        requestid: existing._id
      });
    }

    const request = await resetrequest.create({
      organizer: req.user?._id,
      reason: result.data.reason,
      status: 'pending'
    });

    res.status(201).json({
      message: 'reset request submitted',
      requestid: request._id,
      createdat: request.createdat
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
}
