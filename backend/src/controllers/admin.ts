import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Organizer } from '../models/user';
import { CreateOrganizerSchema } from '../schemas/user'

export const createorganizer = async (req: Request, res: Response) => {
  try {
    const result = CreateOrganizerSchema.safeParse(req.body);
    if(!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const { password, ...rest } = result.data;

    const exists = await Organizer.findOne({ email: rest.email });
    if(exists) {
      return res.status(400).json({ message: 'organizer already exists' });
    }

    const org = await Organizer.create({
      ...rest,
      password: await bcrypt.hash(password, 10),
      role: 'Organizer',
    });

    res.status(201).json({
      _id: org.id,
      email: org.email,
      name: org.name,
      category: org.category,
      contact: org.contact,
      tempPassword: password,
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const listorganizers = async (req: Request, res: Response) => {
  try {
    const orgs = await Organizer.find().select('-password');
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const deleteorganizer = async (req: Request, res: Response) => {
  try {
    const org = await Organizer.findById(req.params.orgid);
    if (!org) {
      return res.status(404).json({ message: 'organizer not found' });
    }
    await Organizer.findByIdAndDelete(req.params.orgid);
    res.json({ message: 'organizer removed' });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
