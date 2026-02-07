import { Request, Response } from 'express';
import { event } from '../models/event';
import { registration } from '../models/registration';
import { registerschema } from '../schemas/event';
import { genticket } from '../util/genticket';
import { tocsv } from '../util/csv';

export const registerevent = async (req: Request, res: Response) => {
  try {
    const result = registerschema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const ev = await event.findById(req.params.eventid);

    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.status !== 'published') {
      return res.status(400).json({ message: 'event not open for registration' });
    }

    if (new Date() > ev.dates.deadline) {
      return res.status(400).json({ message: 'registration deadline passed' });
    }

    if (ev.regcount >= ev.limit) {
      return res.status(400).json({ message: 'event is full' });
    }

    const existing = await registration.findOne({
      user: req.user?._id,
      event: ev._id,
      status: 'Registered'
    });

    if (existing) {
      return res.status(400).json({ 
        message: 'already registered',
        ticketid: existing.ticketid
      });
    }

    const reg = await registration.create({
      user: req.user?._id,
      event: ev._id,
      status: 'Registered',
      ticketid: genticket(),
      formdata: result.data.formdata
    });

    await event.findByIdAndUpdate(ev._id, { $inc: { regcount: 1 } });

    res.status(201).json({
      message: 'registration successful',
      ticketid: reg.ticketid,
      event: {
        name: ev.name,
        dates: ev.dates
      }
    });
  } catch (err: any) {
    // console.error('error here :(:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'already registered' });
    }
    res.status(500).json({ message: 'server error' });
  }
};

export const listparticipants = async (req: Request, res: Response) => {
  try {
    const ev = await event.findById(req.params.eventid);

    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your event' });
    }

    const regs = await registration.find({ event: ev._id, status: 'Registered' }).populate('user').sort({ createdAt: 1 });
    // console.log('DEBUG REGS:', JSON.stringify(regs, null, 2));

    res.json({
      total: regs.length,
      participants: regs.map(r => ({
        ticketid: r.ticketid,
        user: r.user,
        formdata: r.formdata,
        checkin: r.checkin,
        registeredat: r.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const exportparticipants = async (req: Request, res: Response) => {
  try {
    const ev = await event.findById(req.params.eventid);

    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your event' });
    }

    const regs = await registration.find({ event: ev._id, status: 'Registered' }).populate('user').sort({ createdAt: 1 });

    const data = regs.map((r: any) => ({
      ticketid: r.ticketid,
      firstname: r.user.firstName,
      lastname: r.user.lastName,
      email: r.user.email,
      contact: r.user.contact,
      college: r.user.college,
      type: r.user.type,
      checkin: r.checkin ? 'yes' : 'no',
      registeredat: r.createdAt.toISOString()
    }));

    const headers = [ 'ticketid', 'firstname', 'lastname', 'email', 'contact', 'college', 'type', 'checkin', 'registeredat' ];

    const csv = tocsv(data, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${ev.name}-participants.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
