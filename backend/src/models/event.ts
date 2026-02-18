import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  description: string;
  type: 'Normal' | 'Merchandise';
  eligibility: string;
  dates: {
    start: Date;
    end: Date;
    deadline: Date;
  };
  limit: number;
  organizer: mongoose.Types.ObjectId;
  tags: string[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  regcount: number;
}

const eventschema = new Schema<IEvent>({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['Normal', 'Merchandise'], required: true },
  eligibility: { type: String, required: true },
  dates: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    deadline: { type: Date, required: true },
  },
  limit: { type: Number, required: true },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  status: { 
    type: String, 
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  regcount: { type: Number, default: 0 }
}, { discriminatorKey: 'type', timestamps: true });

eventschema.index({ organizer: 1, status: 1 });
eventschema.index({ status: 1, 'dates.start': 1 });
eventschema.index({ tags: 1 });
eventschema.index({ name: 'text', description: 'text' });

export const event = mongoose.model<IEvent>('event', eventschema);

export const normalevent = event.discriminator('Normal', new Schema({
  fee: { type: Number, default: 0 },
  formschema: { type: Schema.Types.Mixed }, 
}));

export const merchevent = event.discriminator('Merchandise', new Schema({
  variants: [{ 
    name: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    price: { type: Number, default: 0, min: 0 }
  }],
  purchaseLimit: { type: Number, default: 1 },
}));
