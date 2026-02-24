import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Participant } from '../models/user';
import { z } from 'zod';

export const getprofile = async (req: Request, res: Response) => {
  try {
    const user = await Participant.findById(req.user?._id.toString()).select('-password').populate('following', 'name category');
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'server error' });
  }
};

const updateschema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  contact: z.string().min(10).optional(),
  college: z.string().min(1).optional(),
  interests: z.array(z.string()).optional(),
  following: z.array(z.string()).optional(),
})

export const updateprofile = async (req: Request, res: Response) => {
  try {
    const result = updateschema.safeParse(req.body);
    if(!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const user = await Participant.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }

    if (user.type === 'IIIT' && result.data.college && result.data.college !== user.college) {
      return res.status(403).json({ message: 'IIIT students cannot change their college' });
    }

    const updatedUser = await Participant.findByIdAndUpdate(
      req.user?._id,
      { $set: result.data },
      { new: true, runValidators: true },
    ).select('-password');

    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ message: 'server error' });
  }
}

const passchema = z.object({
  current: z.string(),
  newpass: z.string().min(8),
});

export const changepassword = async (req: Request, res: Response) => {
  try {
    const result = passchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }
    const user = await Participant.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }
    const match = await bcrypt.compare(result.data.current, user.password);
    if (!match) {
      return res.status(401).json({ message: 'incorrect password' });
    }
    user.password = await bcrypt.hash(result.data.newpass, 10);
    await user.save();
    res.json({ message: 'password updated' });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
