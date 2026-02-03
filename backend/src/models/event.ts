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
}

const EventSchema = new Schema<IEvent>({
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
}, { discriminatorKey: 'type', timestamps: true });

export const Event = mongoose.model<IEvent>('Event', EventSchema);

export const NormalEvent = Event.discriminator('Normal', new Schema({
  fee: { type: Number, default: 0 },
  formSchema: { type: Schema.Types.Mixed }, 
}));

export const MerchEvent = Event.discriminator('Merchandise', new Schema({
  variants: [{ 
    size: String, 
    color: String,
    stock: { type: Number, required: true, min: 0 }
  }],
  purchaseLimit: { type: Number, default: 1 },
}));
