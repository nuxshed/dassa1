import mongoose, { Schema, Document } from 'mongoose';

export interface iresetrequest extends Document {
  organizer: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  note?: string;
  createdat: Date;
  resolvedat?: Date;
  resolvedby?: mongoose.Types.ObjectId;
  newpassword?: string;
}

const resetrequestschema = new Schema<iresetrequest>({
  organizer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reason: { type: String },
  note: { type: String },
  createdat: { type: Date, default: Date.now },
  resolvedat: { type: Date },
  resolvedby: { type: Schema.Types.ObjectId, ref: 'User' },
  newpassword: { type: String }
}, { timestamps: true });


resetrequestschema.index(
  { organizer: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' }
  }
);

export const resetrequest = mongoose.model<iresetrequest>('resetrequest', resetrequestschema);
