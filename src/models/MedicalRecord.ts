import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalRecord extends Document {
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  type: 'consultation' | 'diagnosis' | 'treatment' | 'lab-result' | 'prescription' | 'follow-up' | 'surgery';
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes: string;
  attachments?: string[];
  followUpDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema: Schema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['consultation', 'diagnosis', 'treatment', 'lab-result', 'prescription', 'follow-up', 'surgery'],
      required: true,
    },
    diagnosis: { type: String },
    treatment: { type: String },
    prescription: { type: String },
    notes: { type: String, required: true },
    attachments: [{ type: String }],
    followUpDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ patientId: 1 });
MedicalRecordSchema.index({ doctorId: 1 });
MedicalRecordSchema.index({ date: -1 });

export const MedicalRecord =
  mongoose.models.MedicalRecord || mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
