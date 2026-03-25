import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  type: 'checkup' | 'consultation' | 'follow-up' | 'procedure' | 'lab' | 'vaccination' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  duration: number;
  room?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: {
      type: String,
      enum: ['checkup', 'consultation', 'follow-up', 'procedure', 'lab', 'vaccination', 'emergency'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    reason: { type: String, required: true },
    notes: { type: String },
    duration: { type: Number, default: 30 },
    room: { type: String },
  },
  { timestamps: true }
);

AppointmentSchema.index({ date: 1, time: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ status: 1 });

export const Appointment =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
