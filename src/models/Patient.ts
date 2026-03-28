import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: string;
  bloodType?: string;
  allergies?: string[];
  status: 'admitted' | 'discharged' | 'outpatient' | 'emergency';
  assignedDoctor?: mongoose.Types.ObjectId;
  department: string;
  mrn?: string;
  medicalHistory?: Array<{
    diagnosis: string;
    treatment?: string;
    notes?: string;
    visitType?: string;
    prescriptions?: string;
    followUpDate?: Date;
    date: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    address: { type: String },
    emergencyContact: { type: String },
    bloodType: { type: String },
    allergies: [{ type: String }],
    status: {
      type: String,
      enum: ['admitted', 'discharged', 'outpatient', 'emergency'],
      default: 'outpatient',
    },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
    department: { type: String, required: true },
    mrn: { type: String },
    medicalHistory: [{
      diagnosis: { type: String, required: true },
      treatment: { type: String },
      notes: { type: String },
      visitType: { type: String },
      prescriptions: { type: String },
      followUpDate: { type: Date },
      date: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

export const Patient =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
