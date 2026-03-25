import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  code: string;
  description: string;
  price: number;
  duration: number;
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    duration: { type: Number, default: 30 },
    department: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service =
  mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
