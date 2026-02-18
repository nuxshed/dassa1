import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Participant, Organizer } from '../models/user';
import { CreateParticipantSchema, CreateOrganizerSchema } from '../schemas/user';
import { z } from 'zod';

const gentoken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '30d'});
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = CreateParticipantSchema.safeParse(req.body);
    if(!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const { password, type, ...rest } = result.data;

    if (await User.exists({ email: rest.email })) {
      return res.status(400).json({ message: "user exists" });
    }

    const user = await Participant.create({
      ...rest,
      password: await bcrypt.hash(password, 10),
      type: type === "External" ? "Non-IIIT" : type,
      role: "Participant",
    });

    if(user) {
      res.status(201).json({
        _id: user.id,
        email: user.email,
        role: user.role,
        token: gentoken(user.id),
      });
    } else {
      res.status(400).json({ message: "invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: 'server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if(user && (await bcrypt.compare(password, user.password))) {
      if ((user as any).disabled) {
        return res.status(403).json({ message: 'account disabled' });
      }
      res.json({
        _id: user.id,
        email: user.email,
        role: user.role,
        token: gentoken(user.id),
      });
    } else {
      res.status(401).json({ message: "invalid email or password" });
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "server error" });
  }
}

export const getme = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id.toString()).select("-password");
  res.status(200).json(user);
}
