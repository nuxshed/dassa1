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
      eligibility,
      dateFrom,
      dateTo,
      following,
      limit = 20,
      skip = 0
    } = req.query;

    const query: any = {};

    if (!req.user || req.user.role !== 'Organizer') {
      query.status = 'published';
    } else {
      query.organizer = req.user._id;
      if (status) {
        query.status = status;
      }
    }

    if (type) query.type = type;
    if (eligibility) query.eligibility = eligibility;
    if (organizer) query.organizer = organizer;
    if (tags) {
      const taglist = (tags as string).split(',');
      query.tags = { $in: taglist };
    }

    // date range filter
    if (dateFrom || dateTo) {
      query['dates.start'] = {};
      if (dateFrom) query['dates.start'].$gte = new Date(dateFrom as string);
      if (dateTo) query['dates.start'].$lte = new Date(dateTo as string);
    }

    // followed clubs filter
    if (following) {
      const ids = (following as string).split(',');
      query.organizer = { $in: ids };
    }

    // search: regex partial match on event name
    // we also search organizer name after population
    let nameRegex: RegExp | null = null;
    if (search) {
      const escaped = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      nameRegex = new RegExp(escaped, 'i');
      query.name = { $regex: nameRegex };
    }

    let events = await event
      .find(query)
      .populate('organizer', 'name category')
      .sort({ 'dates.start': 1 })
      .select('-formschema');

    // also match organizer name if search is provided
    if (search && nameRegex) {
      const allByOrg = await event
        .find({ ...query, name: undefined })
        .populate('organizer', 'name category')
        .sort({ 'dates.start': 1 })
        .select('-formschema');

      const orgMatches = allByOrg.filter(e => {
        const org = e.organizer as any;
        return org?.name && nameRegex!.test(org.name);
      });

      // merge without duplicates
      const ids = new Set(events.map(e => e._id.toString()));
      for (const e of orgMatches) {
        if (!ids.has(e._id.toString())) {
          events.push(e);
          ids.add(e._id.toString());
        }
      }
    }

    const total = events.length;
    const paginated = events.slice(Number(skip), Number(skip) + Number(limit));

    res.json({
      events: paginated,
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

    if (!ev) {
        return res.status(404).json({ message: 'Event not found' });
    }

    if (result.data.dates) {
        ev.dates = { ...ev.dates, ...result.data.dates };
        delete (result.data as any).dates;
    }

    // Explicitly update fields to be safe with Mongoose and Discriminators
    if (result.data.description !== undefined) ev.description = result.data.description;
    if (result.data.limit !== undefined) ev.limit = result.data.limit;
    if (result.data.status !== undefined) ev.status = result.data.status as any;
    
    // Handle Discriminator specific fields
    if (ev.type === 'Normal') {
        if (result.data.fee !== undefined) (ev as any).fee = result.data.fee;
    } else if (ev.type === 'Merchandise') {
        if (result.data.variants !== undefined) (ev as any).variants = result.data.variants;
        if (result.data.purchaseLimit !== undefined) (ev as any).purchaseLimit = result.data.purchaseLimit;
    }
    
    await ev.save();
    res.json(ev);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
};

export const deletevent = async (req: Request, res: Response) => {
  try {
    const ev = req.event;
    await registration.deleteMany({ event: ev._id });
    await event.findByIdAndDelete(ev._id);
    res.json({ message: 'event deleted' });
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
      status: { $in: ['Registered', 'Pending', 'Purchased'] }
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

export const trendingevents = async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trending = await registration.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const eventIds = trending.map(t => t._id);
    const events = await event
      .find({ _id: { $in: eventIds }, status: 'published' })
      .populate('organizer', 'name category')
      .select('-formschema');

    // preserve trending order
    const ordered = eventIds
      .map(id => events.find(e => e._id.toString() === id.toString()))
      .filter((e): e is any => !!e)
      .slice(0, 5);

    if (ordered.length < 5) {
      const needed = 5 - ordered.length;
      const existingIds = ordered.map(e => e._id);

      const backfill = await event
        .find({
          status: 'published',
          _id: { $nin: existingIds }
        })
        .sort({ regcount: -1 })
        .limit(needed)
        .populate('organizer', 'name category')
        .select('-formschema');

      ordered.push(...backfill);
    }

    res.json({ events: ordered });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};


