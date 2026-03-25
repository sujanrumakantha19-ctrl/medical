import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description: string;
  headDoctor?: mongoose.Types.ObjectId;
  capacity: number;
  currentOccupancy: number;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    headDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
    capacity: { type: Number, default: 20 },
    currentOccupancy: { type: Number, default: 0 },
    phone: { type: String },
    email: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Department =
  mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
