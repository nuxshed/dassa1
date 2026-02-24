import { Request, Response } from 'express';
import { event } from '../models/event';
import { registration } from '../models/registration';
import { tocsv } from '../util/csv';

export const checkinticket = async (req: Request, res: Response) => {
  try {
    const { ticketid } = req.body;
    if (!ticketid) {
      return res.status(400).json({ message: 'ticketid required' });
    }

    const reg = await registration.findOne({ ticketid }).populate('user', 'firstName lastName email');
    if (!reg) {
      return res.status(404).json({ message: 'ticket not found' });
    }

    if (reg.event.toString() !== req.params.eventid) {
      return res.status(400).json({ message: 'ticket does not belong to this event' });
    }

    if (!['Registered', 'Purchased'].includes(reg.status)) {
      return res.status(400).json({ message: `cannot check in with status: ${reg.status}` });
    }

    if (reg.checkin) {
      return res.status(409).json({
        message: 'already checked in',
        checkinat: reg.checkinat,
        user: reg.user
      });
    }

    reg.checkin = true;
    reg.checkinat = new Date();
    reg.checkinlog.push({ action: 'scan', by: req.user!._id, at: new Date() });
    await reg.save();

    res.json({
      message: 'checked in',
      ticketid: reg.ticketid,
      checkinat: reg.checkinat,
      user: reg.user
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const manualcheckin = async (req: Request, res: Response) => {
  try {
    const { ticketid, reason } = req.body;
    if (!ticketid || !reason) {
      return res.status(400).json({ message: 'ticketid and reason required' });
    }

    const reg = await registration.findOne({ ticketid }).populate('user', 'firstName lastName email');
    if (!reg) {
      return res.status(404).json({ message: 'ticket not found' });
    }

    if (reg.event.toString() !== req.params.eventid) {
      return res.status(400).json({ message: 'ticket does not belong to this event' });
    }

    const wasCheckedIn = reg.checkin;
    reg.checkin = true;
    reg.checkinat = reg.checkinat || new Date();
    reg.checkinlog.push({ action: wasCheckedIn ? 'manual-override' : 'manual-checkin', reason, by: req.user!._id, at: new Date() });
    await reg.save();

    res.json({
      message: wasCheckedIn ? 'manual override applied' : 'manually checked in',
      ticketid: reg.ticketid,
      checkinat: reg.checkinat,
      user: reg.user
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const attendancestats = async (req: Request, res: Response) => {
  try {
    const ev = await event.findById(req.params.eventid);
    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your event' });
    }

    const regs = await registration.find({
      event: ev._id,
      status: { $in: ['Registered', 'Pending', 'Purchased'] }
    }).populate('user', 'firstName lastName email').sort({ createdAt: 1 });

    const total = regs.length;
    const checkedin = regs.filter(r => r.checkin).length;

    res.json({
      total,
      checkedin,
      participants: regs.map(r => ({
        ticketid: r.ticketid,
        user: r.user,
        checkin: r.checkin,
        checkinat: r.checkinat,
        status: r.status
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const exportattendance = async (req: Request, res: Response) => {
  try {
    const ev = await event.findById(req.params.eventid);
    if (!ev) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (ev.organizer.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your event' });
    }

    const regs = await registration.find({
      event: ev._id,
      status: { $in: ['Registered', 'Pending', 'Purchased'] }
    }).populate('user').sort({ createdAt: 1 });

    const data = regs.map((r: any) => ({
      ticketid: r.ticketid,
      firstname: r.user.firstName,
      lastname: r.user.lastName,
      email: r.user.email,
      status: r.status,
      checkin: r.checkin ? 'yes' : 'no',
      checkinat: r.checkinat ? r.checkinat.toISOString() : '',
      registeredat: r.createdAt.toISOString()
    }));

    const headers = ['ticketid', 'firstname', 'lastname', 'email', 'status', 'checkin', 'checkinat', 'registeredat'];
    const csv = tocsv(data, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${ev.name}-attendance.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};
