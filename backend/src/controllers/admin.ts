import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Organizer } from '../models/user';
import { CreateOrganizerSchema } from '../schemas/user';
import { resetrequest } from '../models/resetrequest';
import { resolveresetschema } from '../schemas/resetreq';
import { genpass } from '../util/genpass';

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

export const listresetrequests = async (req: Request, res: Response) => {
  try {
    const requests = await resetrequest.find({ status: 'pending'}).populate('organizer', 'name email category').sort({ createdat: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const resolveresetrequest = async (req: Request, res: Response) => {
  try {
    const result = resolveresetschema.safeParse(req.body);

    if(!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const request = await resetrequest.findById(req.params.reqid);
    if (!request) {
      return res.status(404).json({ message: 'request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'request already resolved' });
    }

    const { action, note } = result.data;
    let newpass: string | undefined;

    if (action === 'approve') {
      newpass = genpass();
      const hashed = await bcrypt.hash(newpass, 10);

      await Organizer.findByIdAndUpdate(request.organizer, {
        password: hashed
      });

      request.status = 'approved';
      request.newpassword = newpass;
    } else {
      request.status = 'rejected';
    }

    if (note) {
      request.note = note;
    }

    request.resolvedat = new Date();
    request.resolvedby = req.user?._id;
    await request.save();

    const response: any = {
      message: `request ${action}d`,
      requestid: request._id,
      status: request.status
    };

    if (newpass) {
      response.newpass = newpass;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
}
