import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'Participant' | 'Organizer' | 'Admin';
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Participant', 'Organizer', 'Admin'], required: true },
}, { discriminatorKey: 'role', timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IParticipant extends IUser {
  firstName: string;
  lastName: string;
  contact: string;
  college: string;
  type: 'IIIT' | 'Non-IIIT';
  interests: string[];
  following: mongoose.Types.ObjectId[];
}

const ParticipantSchema = new Schema<IParticipant>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  contact: { type: String, required: true },
  college: { type: String, required: true },
  type: { type: String, enum: ['IIIT', 'Non-IIIT'], required: true },
  interests: [{ type: String }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export const Participant = User.discriminator<IParticipant>('Participant', ParticipantSchema);

export interface IOrganizer extends IUser {
  name: string;
  category: string;
  description?: string;
  contactEmail?: string;
  contact: string;
  disabled: boolean;
}

const OrganizerSchema = new Schema<IOrganizer>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  contactEmail: { type: String },
  contact: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});

export const Organizer = User.discriminator<IOrganizer>('Organizer', OrganizerSchema);

export interface IAdmin extends IUser {}
const AdminSchema = new Schema<IAdmin>({});
export const Admin = User.discriminator<IAdmin>('Admin', AdminSchema);
