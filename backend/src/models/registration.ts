import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  status: 'Registered' | 'Purchased' | 'Cancelled';
  ticketid: string;
  checkin: boolean;
  formdata?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const registrationschema = new Schema<IRegistration>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Registered', 'Purchased', 'Cancelled'], default: 'Registered' },
  ticketid: { type: String, required: true, unique: true },
  checkin: { type: Boolean, default: false },
  formdata: { type: Schema.Types.Mixed },
}, { timestamps: true });

registrationschema.index({ user: 1, event: 1 }, { unique: true });
registrationschema.index({ event: 1, status: 1 });
registrationschema.index({ ticketid: 1 });

export const registration = mongoose.model<IRegistration>('Registration', registrationschema);
