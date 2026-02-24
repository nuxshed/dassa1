import { Request, Response } from 'express';
import { event, normalevent, merchevent } from '../models/event';
import { registration } from '../models/registration';
import { registerschema } from '../schemas/event';
import { uploadproofschema, updatepaymentstatusschema } from '../schemas/registration';
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

    if (ev.type !== 'Merchandise') {
      const existing = await registration.findOne({
        user: req.user?._id,
        event: ev._id,
        status: { $in: ['Registered', 'Pending', 'Purchased'] } 
      });

      if (existing) {
        return res.status(400).json({ 
          message: 'already registered',
          ticketid: existing.ticketid
        });
      }
    }

    if (ev.type === 'Normal') {
      const nev = await normalevent.findById(ev._id);
      const fields = nev?.formschema?.fields;
      if (fields && fields.length > 0) {
        const formdata = result.data.formdata || [];
        for (const field of fields) {
          if (field.required) {
            const entry = formdata.find((d: any) => d.label === field.label);
            if (!entry || entry.value === undefined || entry.value === '') {
              return res.status(400).json({ message: `${field.label} is required` });
            }
          }
        }
      }
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

    const regs = await registration.find({ event: ev._id, status: { $in: ['Registered', 'Pending', 'Purchased'] } }).populate('user').sort({ createdAt: 1 });

    res.json({
      total: regs.length,
      participants: regs.map(r => ({
        ticketid: r.ticketid,
        user: r.user,
        formdata: r.formdata,
        checkin: r.checkin,
        registeredat: r.createdAt,
        status: r.status,
        payment: r.payment
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

    const regs = await registration.find({ event: ev._id, status: { $in: ['Registered', 'Pending', 'Purchased'] } }).populate('user').sort({ createdAt: 1 });

    const formLabels: string[] = [];
    for (const r of regs) {
      if (r.formdata && Array.isArray(r.formdata)) {
        for (const f of r.formdata as any[]) {
          const label = f.label || f.name;
          if (label && !formLabels.includes(label)) {
            formLabels.push(label);
          }
        }
      }
    }

    const data = regs.map((r: any) => {
      const row: any = {
        ticketid: r.ticketid,
        firstname: r.user.firstName,
        lastname: r.user.lastName,
        email: r.user.email,
        contact: r.user.contact,
        college: r.user.college,
        type: r.user.type,
        checkin: r.checkin ? 'yes' : 'no',
        status: r.status,
        registeredat: r.createdAt.toISOString()
      };
      for (const label of formLabels) {
        const entry = r.formdata?.find((f: any) => (f.label || f.name) === label);
        row[label] = entry ? String(entry.value) : '';
      }
      return row;
    });

    const headers = ['ticketid', 'firstname', 'lastname', 'email', 'contact', 'college', 'type', 'checkin', 'status', 'registeredat', ...formLabels];

    const csv = tocsv(data, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${ev.name}-participants.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const getmyregistrations = async (req: Request, res: Response) => {
  try {
    const regs = await registration.find({ user: req.user?._id })
      .populate('event', 'name dates type status')
      .sort({ createdAt: -1 });

    res.json({
      count: regs.length,
      registrations: regs.map(r => ({
        ticketid: r.ticketid,
        event: r.event,
        status: r.status,
        formdata: r.formdata,
        registeredat: r.createdAt,
        payment: r.payment
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const getticket = async (req: Request, res: Response) => {
  try {
    const reg = await registration.findOne({ ticketid: req.params.ticketid }).populate('event', 'name dates locaiton type').populate('user', 'firstName lastName email');

    if (!reg) {
      return res.status(404).json({ message: 'ticket not found' });
    }

    const isowner = reg.user._id.toString() === req.user?._id.toString();
    const isorganizer = (reg.event as any).organizer?.toString() === req.user?._id.toString();

    if (!isowner && !isorganizer && req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'not authorized' });
    }

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const uploadpaymentproof = async (req: Request, res: Response) => {
  try {
    const result = uploadproofschema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
    }

    const { proofUrl } = result.data;
    
    const reg = await registration.findOne({ ticketid: req.params.ticketid }).populate('event');

    if (!reg) {
      return res.status(404).json({ message: 'registration not found' });
    }

    if (reg.user.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'not your registration' });
    }

    if (!['Registered', 'Rejected'].includes(reg.status)) {
      return res.status(400).json({ message: `cannot upload proof in ${reg.status} state` });
    }

    reg.payment = {
      proof: proofUrl,
      uploadedat: new Date()
    };

    reg.status = 'Pending';
    await reg.save();

    res.json({ message: 'proof uploaded, pending approval', status: reg.status });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const updatepaymentstatus = async (req: Request, res: Response) => {
  try {
    const result = updatepaymentstatusschema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const { status } = result.data;

    const reg = await registration.findOne({ ticketid: req.params.ticketid }).populate('event');

    if (!reg) {
      return res.status(404).json({ message: 'registration not found' });
    }

    const ev = reg.event as any;

    if (ev.organizer.toString() !== req.user?._id.toString() && req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'not authorized' });
    }

    if (reg.status === 'Purchased') {
      return res.status(400).json({ message: 'payment already approved' });
    }

    if (status === 'Purchased' && ev.type === 'Merchandise') {
       const variantObj = reg.formdata?.find((f: any) => f.label === 'Variant' || f.name === 'Variant' || f.name === 'variant');
       
       if (variantObj) {
         const variantName = variantObj.value;
         
         const updatedEvent = await merchevent.findOneAndUpdate(
           { 
             _id: ev._id, 
             variants: { $elemMatch: { name: variantName, stock: { $gt: 0 } } }
           },
           { $inc: { "variants.$.stock": -1 } },
           { new: true }
         );

         if (!updatedEvent) {
            return res.status(400).json({ message: 'out of stock or variant not found' });
         }
       }
    }

    reg.status = status;
    await reg.save();

    res.json({ message: `payment ${status}`, status: reg.status });
  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
};

export const exportallregistrations = async (req: Request, res: Response) => {
  try {
    const events = await event.find({ organizer: req.user?._id });
    const eventIds = events.map(e => e._id);

    const regs = await registration.find({ event: { $in: eventIds } })
      .populate('user', 'firstName lastName email contact college type')
      .populate('event', 'name')
      .sort({ createdAt: -1 });

    const data = regs.map((r: any) => ({
        event: r.event.name,
        ticketid: r.ticketid,
        firstname: r.user.firstName,
        lastname: r.user.lastName,
        email: r.user.email,
        contact: r.user.contact,
        college: r.user.college,
        type: r.user.type,
        status: r.status,
        registeredat: r.createdAt.toISOString()
    }));

    const headers = ['event', 'ticketid', 'firstname', 'lastname', 'email', 'contact', 'college', 'type', 'status', 'registeredat'];
    const csv = tocsv(data, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="all-participants.csv"`);
    res.send(csv);

  } catch (err) {
    res.status(500).json({ message: 'server error' });
  }
}
