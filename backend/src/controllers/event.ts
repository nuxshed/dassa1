import { Request, Response } from 'express';
import { event, normalevent, merchevent } from '../models/event';
import { createventschema, updateventschema } from '../schemas/event';
import { formschema } from '../schemas/event';
import { registration } from '../models/registration';

export const createvent = async (req: Request, res: Response) => {
  try {
    const result = createventschema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const data = {
      ...result.data,
      organizer: req.user?._id,
      status: 'draft'
    };

    let ev;
    if (data.type === 'Normal') {
      ev = await normalevent.create(data);
    } else {
      ev = await merchevent.create(data);
    }

    res.status(201).json(ev);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
}

export const browseevents = async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      status, 
      search, 
      tags, 
      organizer,
      limit = 20,
      skip = 0
    } = req.query;

    const query: any = {};

    if (!req.user || req.user.role !== 'Organizer') {
      query.status = 'published';
    } else {
      if (status) {
        query.status = status;
      }
    }

    if (type) query.type = type;
    if (organizer) query.organizer = organizer;
    if (tags) {
      const taglist = (tags as string).split(',');
      query.tags = { $in: taglist };
    }
    if (search) {
      query.$text = { $search: search as string };
    }

    const events = await event
      .find(query)
      .populate('organizer', 'name category')
      .sort({ 'dates.start': 1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .select('-formschema');

    const total = await event.countDocuments(query);

    res.json({
      events,
      total,
      limit: Number(limit),
      skip: Number(skip)
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const getevent = async (req: Request, res: Response) => {
  try {
    const ev = await event
      .findById(req.params.eventid)
      .populate('organizer', 'name category description contact')
      .select('-formschema');

    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.status !== 'published' && ev.organizer._id.toString() !== req.user?._id?.toString()) {
      return res.status(404).json({ message: 'event not found' });
    }

    res.json(ev);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};


export const updatevent = async (req: Request, res: Response) => {
  try {
    const result = updateventschema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const ev = req.event;

    if (result.data.dates) {
      ev.dates = { ...ev.dates, ...result.data.dates };
      delete (result.data as any).dates;
    }

    Object.assign(ev, result.data);
    await ev.save();

    res.json(ev);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const getform = async (req: Request, res: Response) => {
  try {
    const ev = await normalevent.findById(req.params.eventid);

    if (!ev) {
      return res.status(404).json({ message: 'event not found or not normal event' });
    }

    if (!ev.formschema) {
      return res.json({ fields: [] });
    }

    res.json(ev.formschema);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const updateform = async (req: Request, res: Response) => {
  try {
    const result = formschema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const ev = await normalevent.findById(req.params.eventid);

    if (!ev) {
      return res.status(404).json({ message: 'event not found or not normal event' });
    }

    if (ev.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your event' });
    }

    const regcount = await registration.countDocuments({ 
      event: ev._id, 
      status: 'registered' 
    });

    if (regcount > 0) {
      return res.status(400).json({ 
        message: 'cannot update form after registrations exist' 
      });
    }

    ev.formschema = result.data;
    await ev.save();

    res.json(ev.formschema);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};


