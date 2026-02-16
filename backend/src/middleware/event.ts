import { Request, Response, NextFunction } from 'express';
import { event } from '../models/event';

declare global {
  namespace Express {
    interface Request {
      event?:  any;
    }
  }
}

export const ownevent = async (req:  Request, res: Response, next: NextFunction) => {
  try {
    const ev = await event.findById(req.params.eventid);

    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your event' });
    }

    req.event = ev;
    next();
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const caneditevent = (req: Request, res: Response, next: NextFunction) => {
  const ev = req.event;

  if (!ev) {
    return res.status(404).json({ message: 'event not found' });
  }

  const { status } = req.body;

  if (ev.status === 'draft') {
    return next();
  }

  if (ev.status === 'published') {
    const allowed = ['description', 'dates', 'limit', 'fee', 'status', 'variants'];
    const keys = Object.keys(req.body);

    if (keys.some(k => !allowed.includes(k))) {
      return res.status(400).json({ 
        message: 'can only edit description, deadline, limit, or status when published' 
      });
    }

    if (req.body.dates) {
       const dkeys = Object.keys(req.body.dates);
       if (dkeys.some(k => k !== 'deadline')) {
         return res.status(400).json({ 
           message: 'can only edit deadline in dates when published' 
         });
       }
    }

    if (req.body.limit && req.body.limit < ev.regcount) {
      return res.status(400).json({ 
        message: `limit cannot be less than current registrations (${ev.regcount})` 
      });
    }

    return next();
  }

  if (ev.status === 'ongoing' || ev.status === 'completed') {
    if (Object.keys(req.body).length !== 1 || !status) {
      return res.status(400).json({ 
        message: 'can only change status for ongoing/completed events' 
      });
    }
    return next();
  }

  res.status(400).json({ message: 'event cannot be edited' });
};
