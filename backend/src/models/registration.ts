import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  status: 'Registered' | 'Purchased' | 'Cancelled';
  ticketId: string;
  checkIn: boolean;
}

const RegistrationSchema = new Schema<IRegistration>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Registered', 'Purchased', 'Cancelled'], required: true },
  ticketId: { type: String, required: true, unique: true },
  checkIn: { type: Boolean, default: false },
}, { timestamps: true });

export const Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);
