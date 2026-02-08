import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  status: 'Registered' | 'Pending' | 'Purchased' | 'Rejected' | 'Cancelled';
  ticketid: string;
  checkin: boolean;
  formdata?: any[];
  payment?: {
    proof: string;
    uploadedat: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const registrationschema = new Schema<IRegistration>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'event', required: true },
  status: {
    type: String,
    enum: ['Registered', 'Pending', 'Purchased', 'Rejected', 'Cancelled'],
    default: 'Registered'
  },
  ticketid: { type: String, required: true, unique: true },
  checkin: { type: Boolean, default: false },
  formdata: { type: Schema.Types.Mixed },
  payment: {
    proof: { type: String },
    uploadedat: { type: Date }
  }
}, { timestamps: true });

registrationschema.index({ user: 1, event: 1 }, { unique: true });
registrationschema.index({ event: 1, status: 1 });
registrationschema.index({ ticketid: 1 });

export const registration = mongoose.model<IRegistration>('Registration', registrationschema);
